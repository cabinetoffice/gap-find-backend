import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
    Filter,
    SavedSearch,
    SavedSearchStatusType,
} from '../saved_search/saved_search.entity';
import { SavedSearchNotification } from './saved_search_notification.entity';
import { SavedSearchNotificationService } from './saved_search_notification.service';
import { User } from '../user/user.entity';

describe('SavedSearchNotificationService', () => {
    const FRONT_END_HOST = 'http://localhost:3000';
    let serviceUnderTest: SavedSearchNotificationService;
    let savedSearchNotificationRepository: Repository<SavedSearchNotification>;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                SavedSearchNotificationService,
                {
                    provide: getRepositoryToken(SavedSearchNotification),
                    useValue: {
                        save: jest.fn(),
                        find: jest.fn(),
                        delete: jest.fn(),
                    },
                },
                {
                    provide: ConfigService,
                    useValue: {
                        get: jest.fn().mockImplementation((envVariable) => {
                            switch (envVariable) {
                                case 'FRONT_END_HOST':
                                    return FRONT_END_HOST;
                                default:
                                    return 'mock-env-variable-value';
                            }
                        }),
                    },
                },
            ],
        }).compile();

        serviceUnderTest = module.get<SavedSearchNotificationService>(
            SavedSearchNotificationService,
        );
        savedSearchNotificationRepository = module.get<
            Repository<SavedSearchNotification>
        >(getRepositoryToken(SavedSearchNotification));
    });

    describe('createSavedSearchNotification', () => {
        const savedSearch = {
            id: 1,
            name: 'test',
            filters: [
                {
                    name: 'fields.whoCanApply.EN-US',
                    subFilterid: 1,
                    type: 'text-filter',
                    searchTerm: 'personal / individual',
                },
                {
                    name: 'fields.grantMaximumAward.EN-US',
                    subFilterid: 1,
                    type: 'range-filter',
                    searchTerm: { le: 1000 },
                },
            ],
            search_term: 'Chargepoints',
            fromDate: new Date('2022-03-25T14:00:00.000Z'),
            toDate: new Date('2022-03-30T14:00:00.000Z'),
            status: SavedSearchStatusType.CONFIRMED,
            notifications: false,
            user: {
                id: 1,
                decryptEmail: async () => 'test@test.com',
                hashedEmailAddress: 'hashed-email',
                encryptedEmailAddress: 'encrypted-email',
                updatedAt: new Date('2022-03-25T14:00:00.000Z'),
                createdAt: new Date('2022-06-25T14:00:00.000Z'),
                subscriptions: [],
                newsletterSubscriptions: [],
                savedSearches: [],
                notifications: [],
                sub: null,
            } as User,
        } as SavedSearch;

        it('should create a saved search notification', async () => {
            await serviceUnderTest.createSavedSearchNotification(savedSearch);

            expect(savedSearchNotificationRepository.save).toHaveBeenCalledWith(
                {
                    emailAddress: 'test@test.com',
                    savedSearchName: 'test',
                    resultsUri: `${FRONT_END_HOST}/grants?fields.whoCanApply.EN-US=1&fields.grantMaximumAward.EN-US=1&from-day=25&from-month=3&from-year=2022&to-day=30&to-month=3&to-year=2022&searchTerm=Chargepoints`,
                },
            );
        });

        it('should create the correct results URI if the saved search has no filters', async () => {
            const savedSearchWithNoFilters = {
                ...savedSearch,
                filters: [] as Filter[],
            };
            await serviceUnderTest.createSavedSearchNotification(
                savedSearchWithNoFilters,
            );

            expect(savedSearchNotificationRepository.save).toHaveBeenCalledWith(
                {
                    emailAddress: 'test@test.com',
                    savedSearchName: 'test',
                    resultsUri: `${FRONT_END_HOST}/grants?from-day=25&from-month=3&from-year=2022&to-day=30&to-month=3&to-year=2022&searchTerm=Chargepoints`,
                },
            );
        });

        it('should create the correct results URI if the saved search has no dates', async () => {
            const savedSearchWithNoDates = {
                ...savedSearch,
                filters: [],
                fromDate: null,
                toDate: null,
            } as SavedSearch;

            await serviceUnderTest.createSavedSearchNotification(
                savedSearchWithNoDates,
            );

            expect(savedSearchNotificationRepository.save).toHaveBeenCalledWith(
                {
                    emailAddress: 'test@test.com',
                    savedSearchName: 'test',
                    resultsUri: `${FRONT_END_HOST}/grants?searchTerm=Chargepoints`,
                },
            );
        });
    });

    describe('getAllSavedSearchNotifications', () => {
        it('should return all saved search notifications', async () => {
            await serviceUnderTest.getAllSavedSearchNotifications();
            expect(savedSearchNotificationRepository.find).toBeCalledWith({});
            expect(savedSearchNotificationRepository.find).toBeCalledTimes(1);
        });
    });

    describe('updateSavedSearchNotification', () => {
        it('should save the provided notification', async () => {
            const notification = new SavedSearchNotification();
            notification.emailAddress = 'test-email@and.digital';
            notification.savedSearchName = 'Test Notification 1';
            notification.resultsUri = 'http://test-results.service.com';

            await serviceUnderTest.updateSavedSearchNotification(notification);
            expect(savedSearchNotificationRepository.save).toBeCalledWith(
                notification,
            );
            expect(savedSearchNotificationRepository.save).toBeCalledTimes(1);
        });
    });

    describe('deleteSentSavedSearchNotifications', () => {
        it('should delete all notifications where the email has been sent', async () => {
            await serviceUnderTest.deleteSentSavedSearchNotifications();
            expect(savedSearchNotificationRepository.delete).toBeCalledWith({
                emailSent: true,
            });
            expect(savedSearchNotificationRepository.delete).toBeCalledTimes(1);
        });
    });
});
