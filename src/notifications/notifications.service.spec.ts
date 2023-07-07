import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { DateTime } from 'luxon';
import { SavedSearchNotification } from '../saved_search_notification/saved_search_notification.entity';
import { ContentfulService } from '../contentful/contentful.service';
import { EmailService } from '../email/email.service';
import { GrantService } from '../grant/grant.service';
import { Newsletter, NewsletterType } from '../newsletter/newsletter.entity';
import { NewsletterService } from '../newsletter/newsletter.service';
import {
    SavedSearch,
    SavedSearchStatusType,
} from '../saved_search/saved_search.entity';
import { SavedSearchService } from '../saved_search/saved_search.service';
import { SavedSearchNotificationService } from '../saved_search_notification/saved_search_notification.service';
import { SubscriptionService } from '../subscription/subscription.service';
import { NotificationsService } from './notifications.service';
import { User } from '../user/user.entity';

describe('NotificationsService', () => {
    let serviceUnderTest: NotificationsService;
    let grantService: GrantService;
    let emailService: EmailService;
    let subscriptionService: SubscriptionService;
    let newsletterService: NewsletterService;
    let savedSearchService: SavedSearchService;
    let savedSearchNotificationService: SavedSearchNotificationService;

    const mockFindAllUpdatedGrants = jest.fn();
    const mockFindAllByContentGrantSubscriptionId = jest.fn();
    const mockFindAllUpcomingClosingGrants = jest.fn();
    const mockFindAllUpcomingOpeningGrants = jest.fn();
    const mockEmailSend = jest.fn();
    const mockUpdateEntries = jest.fn();
    const mockFetchEntry = jest.fn();

    const HOST = 'http://localhost:3000';
    const NEW_GRANTS_EMAIL_TEMPLATE_ID = '4a9a0a6c-a5ca-4257-a022-2797687e59c3';

    const mockedFindAllUpcomingClosingGrantsResponse = [
        {
            fields: {
                grantName: 'mock-grant-name',
                label: 'mock-label-name',
                grantApplicationOpenDate: '2022-04-05T00:00:00.000Z',
                grantApplicationCloseDate: '2022-04-20T00:00:00.000Z',
            },
            sys: {
                id: 'mock-grant-id',
            },
            closing: true,
        },
    ];

    beforeAll(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                NotificationsService,
                ConfigService,
                {
                    provide: ConfigService,
                    useValue: {
                        get: jest.fn().mockImplementation((envVariable) => {
                            switch (envVariable) {
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
        }).compile();

        serviceUnderTest =
            module.get<NotificationsService>(NotificationsService);
        grantService = module.get<GrantService>(GrantService);
        emailService = module.get<EmailService>(EmailService);
        subscriptionService =
            module.get<SubscriptionService>(SubscriptionService);
        newsletterService = module.get<NewsletterService>(NewsletterService);
        savedSearchService = module.get<SavedSearchService>(SavedSearchService);
        savedSearchNotificationService =
            module.get<SavedSearchNotificationService>(
                SavedSearchNotificationService,
            );
    });

    it('should be defined', () => {
        expect(serviceUnderTest).toBeDefined();
    });

    describe('processGrantUpdatedNotifications', () => {
        beforeEach(jest.clearAllMocks);

        it('should send a notification for all updated grants', async () => {
            const mockDate = new Date('2022-03-25T14:00:00.000Z');
            jest.useFakeTimers().setSystemTime(mockDate);
            const testGrantId1 = 'test-grant-id-1';
            const testGrantId2 = 'test-grant-id-2';

            const testEmail1 = 'test1@and.digital';
            const testEmail2 = 'test2@and.digital';

            const testContentfulGrant1 = {
                fields: {
                    grantName: 'Test Grant 1 Name',
                    label: 'Test Grant 1 Label',
                },
            };

            const findAllUpdatedGrantsResponse = [testGrantId1, testGrantId2];
            mockFindAllUpdatedGrants.mockResolvedValue(
                findAllUpdatedGrantsResponse,
            );

            const testSubscription1 = {
                contentfulGrantSubscriptionId: testGrantId1,
                user: {
                    decryptEmail: async () => testEmail1,
                },
            };

            const testSubscription2 = {
                contentfulGrantSubscriptionId: testGrantId1,
                user: {
                    decryptEmail: async () => testEmail2,
                },
            };

            const findAllByContentGrantSubscriptionIdResponse = [
                testSubscription1,
                testSubscription2,
            ];
            mockFindAllByContentGrantSubscriptionId.mockImplementation(
                (grantId) => {
                    if (grantId == testGrantId1) {
                        return findAllByContentGrantSubscriptionIdResponse;
                    }
                    return [];
                },
            );

            mockFetchEntry.mockImplementation((grantId) => {
                if (grantId == testGrantId1) {
                    return testContentfulGrant1;
                }
                return [];
            });

            await serviceUnderTest.processGrantUpdatedNotifications();

            expect(grantService.findAllUpdatedGrants).toHaveBeenCalledTimes(1);
            expect(
                subscriptionService.findAllByContentGrantSubscriptionId,
            ).toHaveBeenCalledTimes(2);
            expect(emailService.send).toHaveBeenCalledTimes(2);
            expect(emailService.send).toHaveBeenCalledTimes(2);
            expect(emailService.send).toHaveBeenNthCalledWith(
                1,
                await testSubscription1.user.decryptEmail(),
                'mock-env-variable-value',
                {
                    'name of grant': testContentfulGrant1.fields.grantName,
                    'link to specific grant': `${HOST}/grants/${testContentfulGrant1.fields.label}`,
                },
                'mock-env-variable-value-2022-03-25T14:00:00.000Z',
            );
            expect(emailService.send).toHaveBeenNthCalledWith(
                2,
                await testSubscription2.user.decryptEmail(),
                'mock-env-variable-value',
                {
                    'name of grant': testContentfulGrant1.fields.grantName,
                    'link to specific grant': `${HOST}/grants/${testContentfulGrant1.fields.label}`,
                },
                'mock-env-variable-value-2022-03-25T14:00:00.000Z',
            );
            expect(mockUpdateEntries).toBeCalledTimes(1);
        });
    });

    describe('processGrantUpcomingNotifications', () => {
        beforeEach(() => {
            jest.clearAllMocks();

            grantService.findAllUpcomingClosingGrants =
                mockFindAllUpcomingClosingGrants.mockReturnValue([]);
            grantService.findAllUpcomingOpeningGrants =
                mockFindAllUpcomingOpeningGrants.mockReturnValue([]);
            subscriptionService.findAllByContentGrantSubscriptionId =
                mockFindAllByContentGrantSubscriptionId.mockReturnValue([]);
        });

        it('should fetch all upcoming closing and opening grants', async () => {
            await serviceUnderTest.processGrantUpcomingNotifications();

            expect(mockFindAllUpcomingClosingGrants).toHaveBeenCalledTimes(1);
            expect(mockFindAllUpcomingOpeningGrants).toHaveBeenCalledTimes(1);
        });

        it('should fetch all the subscriptions of upcoming grants', async () => {
            grantService.findAllUpcomingClosingGrants =
                mockFindAllUpcomingClosingGrants.mockReturnValue(
                    mockedFindAllUpcomingClosingGrantsResponse,
                );

            await serviceUnderTest.processGrantUpcomingNotifications();

            expect(
                mockFindAllByContentGrantSubscriptionId,
            ).toHaveBeenCalledTimes(1);
            expect(
                mockFindAllByContentGrantSubscriptionId,
            ).toHaveBeenCalledWith(
                mockedFindAllUpcomingClosingGrantsResponse[0].sys.id,
            );
        });

        it('should send an email for each subscription', async () => {
            const mockDate = new Date('2022-03-25T14:00:00.000Z');
            jest.useFakeTimers().setSystemTime(mockDate);

            const mockedFindAllByContentGrantSubscriptionIdResponse = [
                {
                    id: 'mock-subscription-id',
                    contentfulGrantSubscriptionId: 'mock-grant-id',
                    user: {
                        decryptEmail: async () => 'mock-email-address',
                        encryptedEmailAddress: 'mock-encrypted-email-address',
                        hashedEmailAddress: 'mock-hashed-email-address',
                    },
                },
            ];
            emailService.send = mockEmailSend;
            grantService.findAllUpcomingClosingGrants =
                mockFindAllUpcomingClosingGrants.mockReturnValue(
                    mockedFindAllUpcomingClosingGrantsResponse,
                );
            subscriptionService.findAllByContentGrantSubscriptionId =
                mockFindAllByContentGrantSubscriptionId.mockReturnValue(
                    mockedFindAllByContentGrantSubscriptionIdResponse,
                );

            await serviceUnderTest.processGrantUpcomingNotifications();

            expect(mockEmailSend).toBeCalledTimes(1);
            expect(mockEmailSend).toHaveBeenCalledWith(
                await mockedFindAllByContentGrantSubscriptionIdResponse[0].user.decryptEmail(),
                'mock-env-variable-value',
                {
                    'Name of grant':
                        mockedFindAllUpcomingClosingGrantsResponse[0].fields
                            .grantName,
                    'link to specific grant': `${HOST}/grants/${mockedFindAllUpcomingClosingGrantsResponse[0].fields.label}`,
                    date: '20 April 2022',
                },
                `mock-env-variable-value-${Date.toString()}`,
            );
        });
    });

    describe('processNewGrantsNotifications', () => {
        beforeEach(() => {
            jest.clearAllMocks();
        });

        it('should send a notification to anyone subscribed to the new grants newsletter', async () => {
            const mockDate = new Date('2022-03-25T14:00:00.000Z');
            const mockDateMinus7Days = new Date('2022-03-18T00:00:00.000Z');
            jest.useFakeTimers().setSystemTime(mockDate);

            const testGrantId1 = 'test-grant-id-1';
            const mockNewsletter = {
                id: 1,
                type: NewsletterType.NEW_GRANTS,
                updatedAt: new Date('2022-03-25T14:00:00.000Z'),
                createdAt: new Date('2022-06-25T14:00:00.000Z'),
                user: {
                    id: 1,
                    hashedEmailAddress: 'hashed-email',
                    encryptedEmailAddress: 'encrypted-email',
                    updatedAt: new Date('2022-03-25T14:00:00.000Z'),
                    createdAt: new Date('2022-06-25T14:00:00.000Z'),
                    subscriptions: [],
                    newsletterSubscriptions: [],
                    savedSearches: [],
                    decryptEmail: async () => 'test@test.com',
                } as User,
            } as Newsletter;
            const last7days = DateTime.now().minus({ days: 7 }).startOf('day');
            const today = DateTime.now();

            const expectedLink = new URL(
                `grants?searchTerm=&from-day=${last7days.day}&from-month=${last7days.month}&from-year=${last7days.year}&to-day=${today.day}&to-month=${today.month}&to-year=${today.year}`,
                'http://localhost:3000/',
            );

            jest.spyOn(
                grantService,
                'findGrantsPublishedAfterDate',
            ).mockResolvedValue([testGrantId1]);
            jest.spyOn(newsletterService, 'findAllByType').mockResolvedValue([
                mockNewsletter,
            ]);

            await serviceUnderTest.processNewGrantsNotifications();

            expect(
                grantService.findGrantsPublishedAfterDate,
            ).toHaveBeenNthCalledWith(1, mockDateMinus7Days);

            expect(newsletterService.findAllByType).toHaveBeenNthCalledWith(
                1,
                NewsletterType.NEW_GRANTS,
            );

            expect(emailService.send).toHaveBeenNthCalledWith(
                1,
                await mockNewsletter.user.decryptEmail?.(),
                NEW_GRANTS_EMAIL_TEMPLATE_ID,
                {
                    'Link to new grant summary page': expectedLink,
                },
                `${NEW_GRANTS_EMAIL_TEMPLATE_ID}-${mockDate.toISOString()}`,
            );
        });

        it('should not send a notification if there are no updated grants', async () => {
            const mockDate = new Date('2022-03-25T14:00:00.000Z');
            const mockDateMinus7Days = new Date('2022-03-18T00:00:00.000Z');
            jest.useFakeTimers().setSystemTime(mockDate);

            jest.spyOn(
                grantService,
                'findGrantsPublishedAfterDate',
            ).mockResolvedValue([]);
            jest.spyOn(newsletterService, 'findAllByType').mockResolvedValue(
                null,
            );

            await serviceUnderTest.processNewGrantsNotifications();

            expect(
                grantService.findGrantsPublishedAfterDate,
            ).toHaveBeenNthCalledWith(1, mockDateMinus7Days);

            expect(newsletterService.findAllByType).toHaveBeenCalledTimes(0);
            expect(emailService.send).toBeCalledTimes(0);
        });
    });

    describe('processSavedSearchMatches', () => {
        beforeEach(() => {
            jest.clearAllMocks();
        });

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
                    encryptEmail: async () => 'test@test.com',
                    hashedEmailAddress: 'hashed-email',
                    encryptedEmailAddress: 'encrypted-email',
                    updatedAt: new Date('2022-03-25T14:00:00.000Z'),
                    createdAt: new Date('2022-06-25T14:00:00.000Z'),
                    subscriptions: [],
                    newsletterSubscriptions: [],
                    savedSearches: [],
                    notifications: [],
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

    describe('processSavedSearchMatches', () => {
        beforeEach(() => {
            jest.clearAllMocks();
        });

        it('should send an email for each saved search notification entry', async () => {
            const mockDate = new Date('2022-03-25T14:00:00.000Z');
            jest.useFakeTimers().setSystemTime(mockDate);

            const notification = new SavedSearchNotification();
            notification.emailAddress = 'test-email@and.digital';
            notification.savedSearchName = 'Test Notification 1';
            notification.resultsUri = 'http://test-results.service.com';

            const personalisation = {
                'name of saved search': notification.savedSearchName,
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
                notification.emailAddress,
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
