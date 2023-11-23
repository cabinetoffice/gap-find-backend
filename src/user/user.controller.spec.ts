import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from '../user/user.service';
import { User } from '../user/user.entity';
import { UserController } from './user.controller';
import { EncryptionServiceV2 } from '../encryption/encryptionV2.service';

const mockDate = new Date('2022-03-25T14:00:00.000Z');
jest.spyOn(global, 'Date').mockImplementation(() => mockDate);
describe('UserController', () => {
    let controller: UserController;
    let userService: UserService;
    let encryptionServiceV2: EncryptionServiceV2;
    let mockUser: User;

    beforeEach(async () => {
        mockUser = {
            id: 1,
            emailAddress: 'test@test.com',
            hashedEmailAddress: 'hashed-email',
            encryptedEmailAddress: 'encrypted-email',
            updatedAt: new Date('2022-03-25T14:00:00.000Z'),
            createdAt: new Date('2022-06-25T14:00:00.000Z'),
            sub: 'my-sub',
            subscriptions: [],
            newsletterSubscriptions: [],
            savedSearches: [],
        } as User;

        const module: TestingModule = await Test.createTestingModule({
            controllers: [UserController],
            providers: [
                {
                    provide: User,
                    useValue: {
                        migrate: jest.fn(),
                    },
                },
                {
                    provide: UserService,
                    useValue: {
                        migrateOrCreate: jest.fn(),
                        findBySub: jest.fn(),
                        findByEmail: jest.fn(),
                        delete: jest.fn(),
                    },
                },
                {
                    provide: EncryptionServiceV2,
                    useValue: {
                        decryptV2: jest.fn(),
                    },
                },
            ],
        }).compile();

        controller = module.get<UserController>(UserController);
        userService = module.get<UserService>(UserService);
        encryptionServiceV2 =
            module.get<EncryptionServiceV2>(EncryptionServiceV2);
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });

    describe('getAllByUser function', () => {
        it('should get all the savedSearches based on the user id', async () => {
            jest.spyOn(userService, 'migrateOrCreate').mockResolvedValue({
                isNewUser: true,
            });

            jest.spyOn(encryptionServiceV2, 'decryptV2').mockResolvedValue(
                'john.doe@cabinetoffice.gov.uk',
            );

            const email = Buffer.from('john.doe@cabinetoffice.gov.uk', 'utf-8');

            const response = await controller.migrate(email, '1234');

            expect(userService.migrateOrCreate).toHaveBeenCalledWith(
                'john.doe@cabinetoffice.gov.uk',
                '1234',
            );
            expect(response).toStrictEqual({
                isNewUser: true,
            });
        });
    });
    it('should delete user by sub', async () => {
        jest.spyOn(userService, 'findBySub').mockImplementationOnce(
            async () => mockUser,
        );

        await controller.delete('1234', undefined);

        expect(userService.findBySub).toHaveBeenCalledWith('1234');
        expect(userService.delete).toHaveBeenCalledWith(1);
    });

    it('should delete user by email', async () => {
        jest.spyOn(userService, 'findByEmail').mockImplementationOnce(
            async () => mockUser,
        );

        await controller.delete(undefined, 'test.user@email.gov');

        expect(userService.findByEmail).toHaveBeenCalledWith(
            'test.user@email.gov',
        );
        expect(userService.delete).toHaveBeenCalledWith(1);
    });
});
