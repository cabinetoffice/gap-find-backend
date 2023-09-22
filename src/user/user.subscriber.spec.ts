import { Test, TestingModule } from '@nestjs/testing';
import {
    Connection,
    EntityManager,
    EntityMetadata,
    QueryRunner,
} from 'typeorm';
import { EncryptionService } from '../encryption/encryption.service';
import { HashService } from '../hash/hash.service';
import { User } from './user.entity';
import { UserSubscriber } from './user.subscriber';
import { ColumnMetadata } from 'typeorm/metadata/ColumnMetadata';
import { RelationMetadata } from 'typeorm/metadata/RelationMetadata';

describe('UserSubscriber', () => {
    let service: UserSubscriber;
    let encryptionService: EncryptionService;
    let hashService: HashService;

    const getMockUser = (overrides?: Partial<User>): User => ({
        id: 1,
        decryptEmail: async () => 'test@test.com',
        emailAddress: 'test@test.com',
        hashedEmailAddress: 'hashed-email',
        encryptedEmailAddress: 'encrypted-email',
        updatedAt: new Date('2022-03-25T14:00:00.000Z'),
        createdAt: new Date('2022-06-25T14:00:00.000Z'),
        subscriptions: [],
        newsletterSubscriptions: [],
        savedSearches: [],
        sub: null,
        ...overrides,
    });

    const mockEncryptUser = (user: User) => ({
        ...user,
        encryptedEmailAddress: 'encrypted-value',
        hashedEmailAddress: 'hashed-value',
    });

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                UserSubscriber,
                {
                    provide: HashService,
                    useValue: {
                        hash: jest.fn().mockReturnValue('hashed-value'),
                    },
                },
                {
                    provide: EncryptionService,
                    useValue: {
                        encrypt: jest.fn().mockResolvedValue('encrypted-value'),
                        decrypt: jest.fn().mockReturnValue('decrypted-value'),
                    },
                },
                {
                    provide: Connection,
                    useValue: {
                        subscribers: [],
                    },
                },
            ],
        }).compile();

        service = module.get<UserSubscriber>(UserSubscriber);
        hashService = module.get<HashService>(HashService);
        encryptionService = module.get<EncryptionService>(EncryptionService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
        expect(hashService).toBeDefined();
        expect(encryptionService).toBeDefined();
    });

    it('should listen to User entity', () => {
        const result = service.listenTo();
        expect(result).toStrictEqual(User);
    });

    it('should encrypt before saving', async () => {
        const mockUser = getMockUser();
        const event = {
            entity: Object.assign({}, mockUser),
            connection: null as Connection,
            queryRunner: null as QueryRunner,
            manager: null as EntityManager,
            metadata: null as EntityMetadata,
        };
        const mockDecryptedEmail = await mockUser.decryptEmail?.();
        await service.beforeInsert(event);

        expect(encryptionService.encrypt).toBeCalledTimes(1);
        expect(encryptionService.encrypt).toBeCalledWith(mockDecryptedEmail);
        expect(hashService.hash).toBeCalledTimes(1);
        expect(hashService.hash).toBeCalledWith(mockDecryptedEmail);
        expect(event.entity).toStrictEqual(mockEncryptUser(mockUser));
    });

    it('should encrypt before updating', async () => {
        const mockUser = getMockUser();
        const event = {
            entity: Object.assign({}, mockUser),
            connection: null as Connection,
            queryRunner: null as QueryRunner,
            manager: null as EntityManager,
            metadata: null as EntityMetadata,
            databaseEntity: null as User,
            updatedColumns: null as ColumnMetadata[],
            updatedRelations: null as RelationMetadata[],
        };
        await service.beforeUpdate(event);

        expect(encryptionService.encrypt).toBeCalledTimes(1);
        expect(encryptionService.encrypt).toBeCalledWith(mockUser.emailAddress);
        expect(hashService.hash).toBeCalledTimes(1);
        expect(hashService.hash).toBeCalledWith(mockUser.emailAddress);
        expect(event.entity).toStrictEqual(mockEncryptUser(mockUser));
    });

    it('should add email decryption method to user on load', async () => {
        const mockUser = getMockUser({
            emailAddress: '',
            decryptEmail: undefined,
        });

        const entity = Object.assign({}, mockUser);
        await service.afterLoad(entity);
        await entity.decryptEmail();

        expect(encryptionService.decrypt).toBeCalledTimes(1);
        expect(encryptionService.decrypt).toBeCalledWith(
            mockUser.encryptedEmailAddress,
        );
        expect(entity).toStrictEqual({
            ...mockUser,
            decryptEmail: expect.any(Function),
            emailAddress: 'decrypted-value',
        });
        expect(entity.decryptEmail).not.toEqual(mockUser.decryptEmail);
    });
});
