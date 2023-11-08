import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from '../user/user.service';
import { User } from '../user/user.entity';
import { SavedSearchController } from './saved_search.controller';
import { CreateSavedSearchDto } from './saved_search.dto';
import { SavedSearch, SavedSearchStatusType } from './saved_search.entity';
import { SavedSearchService } from './saved_search.service';
import { UnsubscribeService } from '../notifications/v2/unsubscribe/unsubscribe.service';

const mockDate = new Date('2022-03-25T14:00:00.000Z');
jest.spyOn(global, 'Date').mockImplementation(() => mockDate);
describe('SavedSearchController', () => {
    let controller: SavedSearchController;
    let savedSearchService: SavedSearchService;
    let userService: UserService;

    const searchToSave: CreateSavedSearchDto = {
        name: 'Chargepoint search',
        search_term: 'Chargepoint',
        filters: [],
        fromDate: new Date('2022-07-01T00:00:00Z'),
        toDate: new Date('2022-08-02T13:29:20Z'),
        status: SavedSearchStatusType.CONFIRMED,
        notifications: false,
        email: 'john.doe@cabinetoffice.gov.uk',
    };

    const user = {
        id: 1,
        hashedEmailAddress: 'john.doe@cabinetoffice.gov.uk',
    } as User;

    const newSavedSearch: SavedSearch = {
        id: 1,
        name: 'Chargepoint search',
        search_term: 'Chargepoint',
        filters: [],
        fromDate: new Date('2022-07-01T00:00:00Z'),
        toDate: new Date('2022-08-02T13:29:20Z'),
        status: SavedSearchStatusType.CONFIRMED,
        notifications: false,
        user: {
            id: 1,
            hashedEmailAddress: 'a-hashed-email',
        } as User,
        createdAt: mockDate,
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [SavedSearchController],
            providers: [
                {
                    provide: SavedSearchService,
                    useValue: {
                        create: jest.fn(),
                        findById: jest.fn(),
                        updateStatus: jest.fn(),
                        getAllByUser: jest.fn(),
                        delete: jest.fn(),
                    },
                },
                {
                    provide: UserService,
                    useValue: {
                        findByEmail: jest.fn(),
                        findBySub: jest.fn(),
                    },
                },
                {
                    provide: UnsubscribeService,
                    useValue: {
                        Connection: jest.fn(),
                    },
                },
            ],
        }).compile();

        controller = module.get<SavedSearchController>(SavedSearchController);
        savedSearchService = module.get<SavedSearchService>(SavedSearchService);
        userService = module.get<UserService>(UserService);
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });

    describe('getAllByUser function', () => {
        it('should get all the savedSearches based on the user id', async () => {
            jest.spyOn(savedSearchService, 'getAllByUser').mockResolvedValue([
                newSavedSearch,
            ]);
            const response: SavedSearch[] = await controller.getAllByUser(
                'john.doe@cabinetoffice.gov.uk',
            );

            expect(savedSearchService.getAllByUser).toHaveBeenCalledWith(
                'john.doe@cabinetoffice.gov.uk',
            );
            expect(response).toStrictEqual([newSavedSearch]);
        });
    });

    describe('create function', () => {
        it('should take a CreateSavedSearchDto, save it and return the values', async () => {
            jest.spyOn(savedSearchService, 'create').mockResolvedValue(
                newSavedSearch,
            );
            const response: SavedSearch = await controller.create(searchToSave);

            expect(savedSearchService.create).toHaveBeenCalledWith(
                searchToSave,
            );
            expect(response).toBe(newSavedSearch);
        });
    });

    describe('updateStatus function', () => {
        it('should update the status of the provided saved search', async () => {
            const savedSearch = Object.assign({}, newSavedSearch);
            savedSearch.status = SavedSearchStatusType.CONFIRMED;
            jest.spyOn(savedSearchService, 'findById').mockResolvedValue(
                newSavedSearch,
            );
            jest.spyOn(savedSearchService, 'updateStatus').mockResolvedValue(
                savedSearch,
            );
            const response = await controller.updateStatus(1, {
                status: SavedSearchStatusType.CONFIRMED,
            });

            expect(response).toBe(savedSearch);
        });
    });

    describe('deleteSearch function', () => {
        it('should delete the saved search', async () => {
            jest.spyOn(userService, 'findByEmail').mockResolvedValue(user);
            const deleteReturn = {
                raw: 'sqlquery',
                affected: 1,
            };
            jest.spyOn(savedSearchService, 'delete').mockResolvedValue(
                deleteReturn,
            );
            const body = { id: 'test@test.com' };
            const response = await controller.delete(1, body, {});

            expect(response).toBe(deleteReturn);
            expect(userService.findByEmail).toHaveBeenCalledWith(body.id);
            expect(savedSearchService.delete).toHaveBeenCalledWith(1, user);
        });
    });

    describe('findById Controller', () => {
        it('should find search by Id', async () => {
            const user = {
                id: 1,
                hashedEmailAddress: 'john.doe@cabinetoffice.gov.uk',
            } as User;
            const savedSearch: SavedSearch = {
                id: 1,
                name: 'Chargepoint search',
                search_term: 'Chargepoint',
                filters: [],
                fromDate: new Date('2022-07-01T00:00:00Z'),
                toDate: new Date('2022-08-02T13:29:20Z'),
                status: SavedSearchStatusType.CONFIRMED,
                notifications: false,
                user: user,
                createdAt: mockDate,
            };
            jest.spyOn(savedSearchService, 'findById').mockResolvedValue(
                savedSearch,
            );
            const response = await controller.getById(1);

            expect(response).toBe(savedSearch);
            expect(savedSearchService.findById).toHaveBeenNthCalledWith(1, 1);
        });
    });
});
