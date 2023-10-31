import { NewsletterService } from './../../newsletter/newsletter.service';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { UnsubscribeService } from './unsubscribe/unsubscribe.service';
import { NotificationsHelper } from './notifications.helper';
import { User } from '../../user/user.entity';
import { SubscriptionService } from '../../subscription/subscription.service';
import { GrantService } from '../../grant/grant.service';
import { EmailService } from '../../email/email.service';
import { ContentfulService } from '../../contentful/contentful.service';
import { NotificationsService } from '../notifications.service';
import { SavedSearchService } from '../../saved_search/saved_search.service';
import { SavedSearchNotificationService } from '../../saved_search_notification/saved_search_notification.service';
import {
    SavedSearch,
    SavedSearchStatusType,
} from '../../saved_search/saved_search.entity';
import { SavedSearchNotification } from '../../saved_search_notification/saved_search_notification.entity';
import { SavedSearchNotificationsService } from './notifications.savedSearch.service';

describe('NotificationsService', () => {
    let serviceUnderTest: SavedSearchNotificationsService;
    let grantService: GrantService;
    let emailService: EmailService;
    let savedSearchService: SavedSearchService;
    let savedSearchNotificationService: SavedSearchNotificationService;

    const mockFindAllUpdatedGrants = jest.fn();
    const mockFindAllByContentGrantSubscriptionId = jest.fn();
    const mockFindAllUpcomingClosingGrants = jest.fn();
    const mockFindAllUpcomingOpeningGrants = jest.fn();
    const mockUpdateEntries = jest.fn();
    const mockFetchEntry = jest.fn();
    const mockBuildUnsubscribeUrl = jest.fn();

    const HOST = 'http://localhost:3000';
    const NEW_GRANTS_EMAIL_TEMPLATE_ID = '4a9a0a6c-a5ca-4257-a022-2797687e59c3';

    beforeAll(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                SavedSearchNotificationsService,
                SavedSearchService,
                NotificationsHelper,
                NotificationsService,
                ConfigService,
                {
                    provide: UnsubscribeService,
                    useValue: {
                        Connection: jest.fn(),
                    },
                },
                {
                    provide: NotificationsHelper,
                    useValue: {
                        buildUnsubscribeUrl: mockBuildUnsubscribeUrl,
                        getUserServiceEmailsBySubBatch: jest
                            .fn()
                            .mockImplementation(() => [
                                {
                                    emailAddress: 'email-from-user-service',
                                    sub: 'test-sub-1',
                                },
                            ]),
                        getNumberOfBatchesOfNotifications: jest
                            .fn()
                            .mockImplementation((len: number) =>
                                len === 0 ? 0 : 1,
                            ),
                        getBatchFromObjectArray: jest
                            .fn()
                            .mockImplementation((subs) => subs),
                    },
                },
                {
                    provide: ConfigService,
                    useValue: {
                        get: jest.fn().mockImplementation((envVariable) => {
                            switch (envVariable) {
                                case 'FRONT_END_HOST':
                                    return 'http://localhost:3001';
                                case 'HOST':
                                    return HOST;
                                case 'GOV_NOTIFY_NEW_GRANTS_EMAIL_TEMPLATE_ID':
                                    return NEW_GRANTS_EMAIL_TEMPLATE_ID;
                                case 'GOV_NOTIFY_SAVED_SEARCH_NOTIFICATION_EMAIL_TEMPLATE_ID':
                                    return 'TEST_SAVED_SEARCH_NOTIFICATION_EMAIL_TEMPLATE_ID';
                                default:
                                    return 'mock-env-variable-value';
                            }
                        }),
                    },
                },
                {
                    provide: EmailService,
                    useValue: {
                        send: jest.fn(),
                    },
                },
                {
                    provide: SubscriptionService,
                    useValue: {
                        findAllByContentGrantSubscriptionId:
                            mockFindAllByContentGrantSubscriptionId,
                    },
                },
                {
                    provide: GrantService,
                    useValue: {
                        findAllUpcomingClosingGrants:
                            mockFindAllUpcomingClosingGrants,
                        findAllUpcomingOpeningGrants:
                            mockFindAllUpcomingOpeningGrants,
                        findAllUpdatedGrants: mockFindAllUpdatedGrants,
                        findGrantsPublishedAfterDate: jest.fn(),
                        findGrantsMatchingFilterCriteria: jest.fn(),
                    },
                },
                {
                    provide: ContentfulService,
                    useValue: {
                        updateEntries: mockUpdateEntries,
                        fetchEntry: mockFetchEntry,
                    },
                },
                {
                    provide: NewsletterService,
                    useValue: {
                        findAllByType: jest.fn(),
                    },
                },
                {
                    provide: SavedSearchService,
                    useValue: {
                        findAllConfirmedSearchesWhereDateRangeIsNullOrOverlaps:
                            jest.fn(),
                    },
                },
                {
                    provide: SavedSearchNotificationService,
                    useValue: {
                        createSavedSearchNotification: jest.fn(),
                        getAllSavedSearchNotifications: jest.fn(),
                        updateSavedSearchNotification: jest.fn(),
                        deleteSentSavedSearchNotifications: jest.fn(),
                    },
                },
            ],
            controllers: [],
        }).compile();

        serviceUnderTest = module.get<SavedSearchNotificationsService>(
            SavedSearchNotificationsService,
        );
        grantService = module.get<GrantService>(GrantService);
        emailService = module.get<EmailService>(EmailService);
        savedSearchService = module.get<SavedSearchService>(SavedSearchService);
        savedSearchNotificationService =
            module.get<SavedSearchNotificationService>(
                SavedSearchNotificationService,
            );
    });

    describe('processSavedSearchMatches', () => {
        beforeEach(jest.clearAllMocks);

        it('should create notifications for all saved searches with a status of CONFIRMED', async () => {
            const testGrantId1 = 'test-grant-id-1';
            const mockDate = new Date('2022-03-25T14:00:00.000Z');
            const mockDateMinus1Day = new Date('2022-03-24T00:00:00.000Z');
            jest.useFakeTimers().setSystemTime(mockDate);

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
                fromDate: null,
                toDate: null,
                status: SavedSearchStatusType.CONFIRMED,
                notifications: false,
                user: {
                    id: 1,
                    savedSearchNotifications: [],
                    encryptEmail: async () => 'test@test.com',
                    hashedEmailAddress: 'hashed-email',
                    encryptedEmailAddress: 'encrypted-email',
                    updatedAt: new Date('2022-03-25T14:00:00.000Z'),
                    createdAt: new Date('2022-06-25T14:00:00.000Z'),
                    subscriptions: [],
                    newsletterSubscriptions: [],
                    sub: null,
                    savedSearches: [],
                    notifications: [],
                    unsubscribeReferences: [],
                } as User,
            } as SavedSearch;

            const matches = [testGrantId1];

            jest.spyOn(
                grantService,
                'findGrantsPublishedAfterDate',
            ).mockResolvedValue([testGrantId1]);

            jest.spyOn(
                savedSearchService,
                'findAllConfirmedSearchesWhereDateRangeIsNullOrOverlaps',
            ).mockResolvedValue([savedSearch]);

            jest.spyOn(
                grantService,
                'findGrantsMatchingFilterCriteria',
            ).mockResolvedValue(matches);

            await serviceUnderTest.processSavedSearchMatches();

            expect(
                grantService.findGrantsPublishedAfterDate,
            ).toHaveBeenNthCalledWith(1, mockDateMinus1Day);

            expect(
                savedSearchService.findAllConfirmedSearchesWhereDateRangeIsNullOrOverlaps,
            ).toHaveBeenNthCalledWith(1, mockDateMinus1Day);

            expect(
                grantService.findGrantsMatchingFilterCriteria,
            ).toHaveBeenNthCalledWith(1, [
                {
                    bool: {
                        must: [
                            {
                                bool: {
                                    should: {
                                        match_phrase: {
                                            'fields.whoCanApply.EN-US':
                                                'personal / individual',
                                        },
                                    },
                                },
                            },
                            {
                                bool: {
                                    should: {
                                        range: {
                                            'fields.grantMaximumAward.EN-US': {
                                                le: 1000,
                                            },
                                        },
                                    },
                                },
                            },
                            {
                                bool: {
                                    should: {
                                        range: {
                                            'sys.createdAt': {
                                                gte: mockDateMinus1Day,
                                            },
                                        },
                                    },
                                },
                            },
                        ],
                    },
                },
                {
                    multi_match: {
                        fields: [
                            'fields.grantName.en-US',
                            'fields.grantSummaryTab.en-US.content.content.value',
                            'fields.grantEligibilityTab.en-US.content.content.value',
                            'fields.grantShortDescription.en-US',
                        ],
                        fuzziness: 'AUTO',
                        operator: 'AND',
                        query: 'Chargepoints',
                    },
                },
            ]);

            expect(
                savedSearchNotificationService.createSavedSearchNotification,
            ).toHaveBeenCalledWith(savedSearch);
        });
    });

    describe('processSavedSearchMatchesNotification', () => {
        beforeEach(jest.clearAllMocks);

        it('should use email from user-service', async () => {
            const mockDate = new Date('2022-03-25T14:00:00.000Z');
            jest.useFakeTimers().setSystemTime(mockDate);
            mockBuildUnsubscribeUrl.mockResolvedValue(
                new URL('http://localhost:3001/unsubscribe/id'),
            );

            const notification = new SavedSearchNotification();
            const user = new User();
            user.decryptEmail = () => Promise.resolve('email');
            notification.user = user;

            notification.savedSearch = new SavedSearch();
            notification.resultsUri = 'http://test-results.service.com';

            const personalisation = {
                'name of saved search': notification.savedSearch.name,
                unsubscribeUrl: new URL('http://localhost:3001/unsubscribe/id'),
                'link to saved search match': notification.resultsUri,
            };

            jest.spyOn(
                savedSearchNotificationService,
                'getAllSavedSearchNotifications',
            ).mockResolvedValue([notification]);

            await serviceUnderTest.processSavedSearchMatchesNotifications();
            expect(
                savedSearchNotificationService.getAllSavedSearchNotifications,
            ).toBeCalledTimes(1);
            expect(emailService.send).toBeCalledWith(
                'email',
                'TEST_SAVED_SEARCH_NOTIFICATION_EMAIL_TEMPLATE_ID',
                personalisation,
                'TEST_SAVED_SEARCH_NOTIFICATION_EMAIL_TEMPLATE_ID-2022-03-25T14:00:00.000Z',
            );
            expect(emailService.send).toBeCalledTimes(1);
            expect(
                savedSearchNotificationService.updateSavedSearchNotification,
            ).toBeCalledWith({
                ...notification,
                emailSent: true,
            });
            expect(
                savedSearchNotificationService.updateSavedSearchNotification,
            ).toBeCalledTimes(1);
            expect(
                savedSearchNotificationService.deleteSentSavedSearchNotifications,
            ).toBeCalledTimes(1);
        });
        it('should send an email for each saved search notification entry', async () => {
            const mockDate = new Date('2022-03-25T14:00:00.000Z');
            jest.useFakeTimers().setSystemTime(mockDate);
            mockBuildUnsubscribeUrl.mockResolvedValue(
                new URL('http://localhost:3001/unsubscribe/id'),
            );

            const notification = new SavedSearchNotification();
            const user = new User();
            user.decryptEmail = () => Promise.resolve('email');
            user.sub = 'test-sub-1';
            notification.user = user;

            notification.savedSearch = new SavedSearch();
            notification.resultsUri = 'http://test-results.service.com';

            const personalisation = {
                'name of saved search': notification.savedSearch.name,
                unsubscribeUrl: new URL('http://localhost:3001/unsubscribe/id'),
                'link to saved search match': notification.resultsUri,
            };

            jest.spyOn(
                savedSearchNotificationService,
                'getAllSavedSearchNotifications',
            ).mockResolvedValue([notification]);

            await serviceUnderTest.processSavedSearchMatchesNotifications();
            expect(
                savedSearchNotificationService.getAllSavedSearchNotifications,
            ).toBeCalledTimes(1);
            expect(emailService.send).toBeCalledWith(
                'email-from-user-service',
                'TEST_SAVED_SEARCH_NOTIFICATION_EMAIL_TEMPLATE_ID',
                personalisation,
                'TEST_SAVED_SEARCH_NOTIFICATION_EMAIL_TEMPLATE_ID-2022-03-25T14:00:00.000Z',
            );
            expect(emailService.send).toBeCalledTimes(1);
            expect(
                savedSearchNotificationService.updateSavedSearchNotification,
            ).toBeCalledWith({
                ...notification,
                emailSent: true,
            });
            expect(
                savedSearchNotificationService.updateSavedSearchNotification,
            ).toBeCalledTimes(1);
            expect(
                savedSearchNotificationService.deleteSentSavedSearchNotifications,
            ).toBeCalledTimes(1);
        });
    });
});
