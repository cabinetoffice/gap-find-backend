import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from '../user/user.service';
import { User } from '../user/user.entity';
import { UserController } from './user.controller';

const mockDate = new Date('2022-03-25T14:00:00.000Z');
jest.spyOn(global, 'Date').mockImplementation(() => mockDate);
describe('UserController', () => {
    let controller: UserController;
    let userService: UserService;

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
            ],
        }).compile();

        controller = module.get<UserController>(UserController);
        userService = module.get<UserService>(UserService);
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });

    describe('getAllByUser function', () => {
        it('should get all the savedSearches based on the user id', async () => {
            const mockUser = new User();
            jest.spyOn(userService, 'migrateOrCreate').mockResolvedValue({
                isExistingUser: true,
                user: mockUser,
            });

            const response = await controller.migrate(
                'john.doe@cabinetoffice.gov.uk',
                '1234',
            );

            expect(userService.migrateOrCreate).toHaveBeenCalledWith(
                'john.doe@cabinetoffice.gov.uk',
                '1234',
            );
            expect(response).toStrictEqual({
                isExistingUser: true,
                user: mockUser,
            });
        });
    });
});
