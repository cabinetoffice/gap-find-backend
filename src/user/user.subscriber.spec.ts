import { TestingModule, Test } from '@nestjs/testing';
import { Connection } from 'typeorm';
import { EncryptionService } from '../encryption/encryption.service';
import { HashService } from '../hash/hash.service';
import { User } from './user.entity';
import { UserSubscriber } from './user.subscriber';

describe('UserSubscriber', () => {
    let service: UserSubscriber;
    let encryptionService: EncryptionService;
    let hashService: HashService;

    const mockUser = {
        id: 1,
        emailAddress: 'test@test.com',
        hashedEmailAddress: 'hashed-email',
        encryptedEmailAddress: 'encrypted-email',
        updatedAt: new Date('2022-03-25T14:00:00.000Z'),
        createdAt: new Date('2022-06-25T14:00:00.000Z'),
        subscriptions: [],
        newsletterSubscriptions: []
    };

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
                        encrypt: jest
                            .fn()
                            .mockResolvedValue('encrypted-value'),
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
    })

    it('should encrypt before saving', async () => {
        const event = {
            entity: Object.assign({}, mockUser),
            connection: null,
            queryRunner: null,
            manager: null,
            metadata: null,
        };
        await service.beforeInsert(event);

        expect(encryptionService.encrypt).toBeCalledTimes(1);
        expect(encryptionService.encrypt).toBeCalledWith(mockUser.emailAddress);
        expect(hashService.hash).toBeCalledTimes(1);
        expect(hashService.hash).toBeCalledWith(mockUser.emailAddress);
        expect(event.entity).toStrictEqual({
            id: 1,
            emailAddress: 'test@test.com',
            hashedEmailAddress: 'hashed-value',
            encryptedEmailAddress: 'encrypted-value',
            updatedAt: new Date('2022-03-25T14:00:00.000Z'),
            createdAt: new Date('2022-06-25T14:00:00.000Z'),
            subscriptions: [],
            newsletterSubscriptions: []
        });
    });

    it('should encrypt before updating', async () => {
        const event = {
            entity: Object.assign({}, mockUser),
            connection: null,
            queryRunner: null,
            manager: null,
            metadata: null,
            databaseEntity: null,
            updatedColumns: null,
            updatedRelations: null
        };
        await service.beforeUpdate(event);

        expect(encryptionService.encrypt).toBeCalledTimes(1);
        expect(encryptionService.encrypt).toBeCalledWith(mockUser.emailAddress);
        expect(hashService.hash).toBeCalledTimes(1);
        expect(hashService.hash).toBeCalledWith(mockUser.emailAddress);
        expect(event.entity).toStrictEqual({
            id: 1,
            emailAddress: 'test@test.com',
            hashedEmailAddress: 'hashed-value',
            encryptedEmailAddress: 'encrypted-value',
            updatedAt: new Date('2022-03-25T14:00:00.000Z'),
            createdAt: new Date('2022-06-25T14:00:00.000Z'),
            subscriptions: [],
            newsletterSubscriptions: []
        });
    });

    it('should decrypt before updating', async () => {
        const entity = Object.assign({}, mockUser)
        await service.afterLoad(entity);

        expect(encryptionService.decrypt).toBeCalledTimes(1);
        expect(encryptionService.decrypt).toBeCalledWith(mockUser.encryptedEmailAddress);
        expect(entity).toStrictEqual({
            id: 1,
            emailAddress: 'decrypted-value',
            hashedEmailAddress: 'hashed-email',
            encryptedEmailAddress: 'encrypted-email',
            updatedAt: new Date('2022-03-25T14:00:00.000Z'),
            createdAt: new Date('2022-06-25T14:00:00.000Z'),
            subscriptions: [],
            newsletterSubscriptions: []
        });
    });
});
