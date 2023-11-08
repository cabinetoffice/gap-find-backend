import { HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DateTime } from 'luxon';
import { User } from 'src/user/user.entity';
import { DeleteResult, Repository, SelectQueryBuilder } from 'typeorm';
import { UserService } from '../user/user.service';
import { CreateSavedSearchDto } from './saved_search.dto';
import { SavedSearch, SavedSearchStatusType } from './saved_search.entity';
import { SavedSearchService } from './saved_search.service';
const mockDate = new Date('2022-03-25T14:00:00.000Z');

describe('SavedSearchService', () => {
    let serviceUnderTest: SavedSearchService;
    let userService: UserService;
    let savedSearchRepository: Repository<SavedSearch>;

    const user = {
        id: 1,
        hashedEmailAddress: 'john.doe@cabinetoffice.gov.uk',
    } as User;
    const user2 = {
        id: 2,
        hashedEmailAddress: 'leo.messi@cabinetoffice.gov.uk',
    } as User;
    const user3 = {
        id: 3,
        hashedEmailAddress: 'cr7@cabinetoffice.gov.uk',
    } as User;
    const searchDtoToSave: CreateSavedSearchDto = {
        name: 'Chargepoint search',
        search_term: 'Chargepoint',
        filters: [],
        fromDate: new Date('2022-07-01T00:00:00Z'),
        toDate: new Date('2022-08-02T13:29:20Z'),
        status: SavedSearchStatusType.CONFIRMED,
        notifications: false,
        email: 'john.doe@cabinetoffice.gov.uk',
    };

    const searchEntityToSave: SavedSearch = {
        id: undefined,
        name: 'Chargepoint search',
        search_term: 'Chargepoint',
        filters: [],
        fromDate: new Date('2022-07-01T00:00:00Z'),
        toDate: new Date('2022-08-02T13:29:20Z'),
        status: SavedSearchStatusType.CONFIRMED,
        notifications: false,
        user,
        createdAt: undefined,
    };

    const newSavedSearch: SavedSearch = {
        id: 1,
        name: 'Chargepoint search',
        search_term: 'Chargepoint',
        filters: [],
        fromDate: new Date('2022-07-01T00:00:00Z'),
        toDate: new Date('2022-08-02T13:29:20Z'),
        status: SavedSearchStatusType.CONFIRMED,
        notifications: false,
        user,
        createdAt: mockDate,
    };
    const savedSearchForUser2: SavedSearch = {
        id: 1,
        name: 'Chargepoint search',
        search_term: 'Chargepoint',
        filters: [],
        fromDate: new Date('2022-07-01T00:00:00Z'),
        toDate: new Date('2022-08-02T13:29:20Z'),
        status: SavedSearchStatusType.CONFIRMED,
        notifications: false,
        user: user2,
        createdAt: mockDate,
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                SavedSearchService,
                {
                    provide: getRepositoryToken(SavedSearch),
                    useValue: {
                        save: jest.fn(),
                        findOne: jest.fn(),
                        find: jest.fn(),
                        createQueryBuilder: jest.fn(),
                        delete: jest.fn(),
                    },
                },
                {
                    provide: ConfigService,
                    useValue: {
                        get: jest.fn((key: string) => {
                            switch (key) {
                                default:
                                    return null;
                            }
                        }),
                    },
                },
                {
                    provide: UserService,
                    useValue: {
                        findByEmail: jest.fn(),
                        findBySub: jest.fn(),
                        create: jest.fn(),
                        createQueryBuilder: jest.fn().mockReturnValue({
                            getMany: jest.fn(),
                        }),
                    },
                },
            ],
        }).compile();

        serviceUnderTest = module.get<SavedSearchService>(SavedSearchService);
        userService = module.get<UserService>(UserService);
        savedSearchRepository = module.get<Repository<SavedSearch>>(
            getRepositoryToken(SavedSearch),
        );
    });

    it('should be defined', () => {
        expect(serviceUnderTest).toBeDefined();
    });

    describe('getAllByUser', () => {
        test('should get all the savedSearches based on the user id', async () => {
            jest.spyOn(userService, 'findByEmail').mockResolvedValue(user);
            jest.spyOn(savedSearchRepository, 'find').mockResolvedValue([
                newSavedSearch,
                savedSearchForUser2,
            ]);
            const response: SavedSearch[] = await serviceUnderTest.getAllByUser(
                'john.doe@cabinetoffice.gov.uk',
            );
            expect(response).toStrictEqual([newSavedSearch]);
            expect(userService.findByEmail).toHaveBeenCalledWith(
                'john.doe@cabinetoffice.gov.uk',
            );
        });
        test('should get an empty array if user is not found', async () => {
            jest.spyOn(userService, 'findByEmail').mockReturnValue(null);
            const response: SavedSearch[] = await serviceUnderTest.getAllByUser(
                'cr7@cabinetoffice.gov.uk',
            );
            expect(response).toStrictEqual([]);
            expect(userService.findByEmail).toHaveBeenCalledWith(
                'cr7@cabinetoffice.gov.uk',
            );
        });
        test('should get an empty array if not savedSearches are found on the user id', async () => {
            jest.spyOn(userService, 'findByEmail').mockResolvedValue(user3);
            jest.spyOn(savedSearchRepository, 'find').mockResolvedValue([
                newSavedSearch,
                savedSearchForUser2,
            ]);
            const response: SavedSearch[] = await serviceUnderTest.getAllByUser(
                'cr7@cabinetoffice.gov.uk',
            );
            expect(response).toStrictEqual([]);
            expect(userService.findByEmail).toHaveBeenCalledWith(
                'cr7@cabinetoffice.gov.uk',
            );
        });
    });
    describe('create', () => {
        it('should take a CreateSavedSearchDto, save it and return the newly saved values', async () => {
            jest.spyOn(userService, 'findByEmail').mockResolvedValue(user);
            jest.spyOn(savedSearchRepository, 'save').mockResolvedValue(
                newSavedSearch,
            );

            const response: SavedSearch = await serviceUnderTest.create(
                searchDtoToSave,
            );

            expect(response).toBe(newSavedSearch);
            expect(userService.findByEmail).toHaveBeenCalledWith(
                'john.doe@cabinetoffice.gov.uk',
            );
            expect(savedSearchRepository.save).toHaveBeenCalledWith(
                searchEntityToSave,
            );
        });

        it('should create a new user if one does not exist and then assign the newly saved search to that user', async () => {
            jest.spyOn(userService, 'findByEmail').mockResolvedValue(undefined);
            jest.spyOn(userService, 'create').mockResolvedValue(user);
            jest.spyOn(savedSearchRepository, 'save').mockResolvedValue(
                newSavedSearch,
            );

            const response: SavedSearch = await serviceUnderTest.create(
                searchDtoToSave,
            );

            expect(response).toBe(newSavedSearch);
            expect(userService.findByEmail).toHaveBeenCalledWith(
                'john.doe@cabinetoffice.gov.uk',
            );
            expect(userService.create).toHaveBeenCalledWith(
                'john.doe@cabinetoffice.gov.uk',
                undefined,
            );
            expect(savedSearchRepository.save).toHaveBeenCalledWith(
                searchEntityToSave,
            );
        });

        it('uses sub to find user when passed', async () => {
            jest.spyOn(userService, 'findByEmail').mockResolvedValue(undefined);
            jest.spyOn(userService, 'findBySub').mockResolvedValue(undefined);
            jest.spyOn(userService, 'create').mockResolvedValue(user);
            jest.spyOn(savedSearchRepository, 'save').mockResolvedValue(
                newSavedSearch,
            );
            const searchDtoWithSub = {
                ...searchDtoToSave,
                sub: 'some-id-doesnt-matter',
            };
            const response: SavedSearch = await serviceUnderTest.create(
                searchDtoWithSub,
            );

            expect(response).toBe(newSavedSearch);
            expect(userService.findByEmail).not.toHaveBeenCalled();
            expect(userService.findBySub).toHaveBeenCalledWith(
                'some-id-doesnt-matter',
            );
        });
    });

    describe('delete', () => {
        it('should find a saved search and delete it', async () => {
            jest.spyOn(serviceUnderTest, 'findById').mockResolvedValue(
                savedSearchForUser2,
            );

            const deleteReturn = {
                raw: 'sqlquery',
                affected: 1,
            };

            jest.spyOn(savedSearchRepository, 'delete').mockResolvedValue(
                deleteReturn,
            );

            const response: DeleteResult = await serviceUnderTest.delete(
                1,
                user2,
            );

            expect(serviceUnderTest.findById).toHaveBeenCalledWith(1);
            expect(savedSearchRepository.delete).toHaveBeenCalledWith({
                id: 1,
            });
            expect(response).toBe(deleteReturn);
        });

        it('should throw an exception if emails do not match', async () => {
            jest.spyOn(serviceUnderTest, 'findById').mockResolvedValue(
                savedSearchForUser2,
            );

            expect(serviceUnderTest.delete(1, user)).rejects.toThrowError(
                expect.objectContaining({
                    message: 'Email does not match',
                    status: HttpStatus.FORBIDDEN,
                }),
            );

            expect(serviceUnderTest.findById).toHaveBeenCalledWith(1);
            expect(savedSearchRepository.delete).not.toBeCalled();
        });
    });

    describe('findById function', () => {
        it('should return the correct saved search', async () => {
            jest.spyOn(savedSearchRepository, 'findOne').mockResolvedValue(
                newSavedSearch,
            );

            const response: SavedSearch = await serviceUnderTest.findById(1);

            expect(response).toBe(newSavedSearch);
            expect(savedSearchRepository.findOne).toHaveBeenCalledWith({
                where: {
                    id: 1,
                },
            });
        });
    });

    describe('updateStatus function', () => {
        it('should update the status of the provided saved search, save it and thenr eturn the updated object', async () => {
            const savedSearch = Object.assign({}, newSavedSearch);
            savedSearch.status = SavedSearchStatusType.DRAFT;

            jest.spyOn(savedSearchRepository, 'save').mockResolvedValue(
                savedSearch,
            );

            //assert the saved search type is correct before proceeding
            expect(savedSearch.status).toBe(SavedSearchStatusType.DRAFT);

            const response: SavedSearch = await serviceUnderTest.updateStatus(
                savedSearch,
                SavedSearchStatusType.CONFIRMED,
            );

            expect(response).toBe(savedSearch);
            expect(savedSearch.status).toBe(SavedSearchStatusType.CONFIRMED);
            expect(savedSearchRepository.save).toHaveBeenCalledWith(
                savedSearch,
            );
        });
    });

    describe('findAllByStatus', () => {
        it('should return saved searches with the correct status', async () => {
            const savedSearch = Object.assign({}, newSavedSearch);

            jest.spyOn(savedSearchRepository, 'find').mockResolvedValue([
                savedSearch,
            ]);

            const response: SavedSearch[] =
                await serviceUnderTest.findAllByStatus(
                    SavedSearchStatusType.CONFIRMED,
                );

            expect(response).toStrictEqual([savedSearch]);
            expect(savedSearchRepository.find).toHaveBeenCalledWith({
                where: {
                    status: SavedSearchStatusType.CONFIRMED,
                },
            });
        });
    });

    //TODO: This test is basic to say the least...potentially requires revisited in future
    describe('findAllConfirmedSearchesWhereDateRangeIsNullOrOverlaps', () => {
        it('should return the correct saved searches', async () => {
            const savedSearch = Object.assign({}, newSavedSearch);

            jest.spyOn(
                savedSearchRepository,
                'createQueryBuilder',
            ).mockReturnValue({
                innerJoinAndSelect: jest.fn().mockReturnThis(),
                where: jest.fn().mockReturnThis(),
                andWhere: jest.fn().mockReturnThis(),
                getMany: jest
                    .fn()
                    .mockResolvedValue([savedSearch]) as any as Promise<
                    SavedSearch[]
                >,
            } as any as SelectQueryBuilder<SavedSearch>);
            const response: SavedSearch[] =
                await serviceUnderTest.findAllConfirmedSearchesWhereDateRangeIsNullOrOverlaps(
                    DateTime.now().toJSDate(),
                );

            expect(response).toStrictEqual([savedSearch]);
        });
    });
});
