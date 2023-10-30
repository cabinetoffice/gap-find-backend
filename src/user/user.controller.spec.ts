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

    beforeEach(async () => {
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
});
