import { NewsletterService } from './../../newsletter/newsletter.service';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { DateTime } from 'luxon';
import { UnsubscribeService } from './unsubscribe/unsubscribe.service';
import { NotificationsHelper } from './notifications.helper';
import { User } from '../../user/user.entity';
import { SubscriptionService } from '../../subscription/subscription.service';
import { Newsletter, NewsletterType } from '../../newsletter/newsletter.entity';
import { GrantService } from '../../grant/grant.service';
import { EmailService } from '../../email/email.service';
import { ContentfulService } from '../../contentful/contentful.service';
import { GrantNotificationsService } from './notifications.grant.service';

describe('NotificationsService', () => {
    let serviceUnderTest: GrantNotificationsService;
    let grantService: GrantService;
    let emailService: EmailService;
    let subscriptionService: SubscriptionService;
    let newsletterService: NewsletterService;

    const mockFindAllUpdatedGrants = jest.fn();
    const mockFindAllByContentGrantSubscriptionId = jest.fn();
    const mockFindAllUpcomingClosingGrants = jest.fn();
    const mockFindAllUpcomingOpeningGrants = jest.fn();
    const mockEmailSend = jest.fn();
    const mockUpdateEntries = jest.fn();
    const mockFetchEntry = jest.fn();
    const mockBuildUnsubscribeUrl = jest.fn();
    const mockGetUserServiceEmailsBySubBatch = jest.fn();

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
                GrantNotificationsService,
                NotificationsHelper,
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
                        getUserServiceEmailsBySubBatch:
                            mockGetUserServiceEmailsBySubBatch,
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
            ],
            controllers: [],
        }).compile();

        serviceUnderTest = module.get<GrantNotificationsService>(
            GrantNotificationsService,
        );
        grantService = module.get<GrantService>(GrantService);
        emailService = module.get<EmailService>(EmailService);
        subscriptionService =
            module.get<SubscriptionService>(SubscriptionService);
        newsletterService = module.get<NewsletterService>(NewsletterService);
    });

    describe('processGrantUpdatedNotifications', () => {
        beforeEach(jest.clearAllMocks);

        it('should send a notification for all updated grants', async () => {
            const mockDate = new Date('2022-03-25T14:00:00.000Z');
            jest.useFakeTimers().setSystemTime(mockDate);
            const TEST_GRANT_ID_1 = 'test-grant-id-1';
            const TEST_GRANT_ID_2 = 'test-grant-id-2';

            const TEST_EMAIL_1 = 'test1@and.digital';
            const TEST_EMAIL_2 = 'test2@and.digital';

            const testContentfulGrant1 = {
                fields: {
                    grantName: 'Test Grant 1 Name',
                    label: 'Test Grant 1 Label',
                },
            };

            mockBuildUnsubscribeUrl.mockResolvedValue(
                new URL('http://localhost:3001/unsubscribe/id'),
            );

            mockFindAllUpdatedGrants.mockResolvedValue([
                TEST_GRANT_ID_1,
                TEST_GRANT_ID_2,
            ]);

            const testSubscription1 = {
                contentfulGrantSubscriptionId: TEST_GRANT_ID_1,
                user: {
                    sub: 'test-sub-1',
                    decryptEmail: async () => TEST_EMAIL_1,
                },
            };

            const testSubscription2 = {
                contentfulGrantSubscriptionId: TEST_GRANT_ID_1,
                user: {
                    decryptEmail: async () => TEST_EMAIL_2,
                },
            };

            mockFindAllByContentGrantSubscriptionId.mockImplementation(
                (grantId) =>
                    grantId === TEST_GRANT_ID_1
                        ? [testSubscription1, testSubscription2]
                        : [],
            );

            mockFetchEntry.mockImplementation((grantId) =>
                grantId === TEST_GRANT_ID_1 ? testContentfulGrant1 : [],
            );

            await serviceUnderTest.processGrantUpdatedNotifications();

            expect(grantService.findAllUpdatedGrants).toHaveBeenCalledTimes(1);
            expect(
                subscriptionService.findAllByContentGrantSubscriptionId,
            ).toHaveBeenCalledTimes(2);
            expect(emailService.send).toHaveBeenCalledTimes(2);

            expect(emailService.send).toHaveBeenNthCalledWith(
                1,
                'email-from-user-service',
                'mock-env-variable-value',
                {
                    'name of grant': testContentfulGrant1.fields.grantName,
                    unsubscribeUrl: new URL(
                        'http://localhost:3001/unsubscribe/id',
                    ),
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
                    unsubscribeUrl: new URL(
                        'http://localhost:3001/unsubscribe/id',
                    ),
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
            mockBuildUnsubscribeUrl.mockResolvedValue(
                new URL('http://localhost:3001/unsubscribe/id'),
            );

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
                    unsubscribeUrl: new URL(
                        'http://localhost:3001/unsubscribe/id',
                    ),
                    'link to specific grant': `${HOST}/grants/${mockedFindAllUpcomingClosingGrantsResponse[0].fields.label}`,
                    date: '20 April 2022',
                },
                `mock-env-variable-value-${Date.toString()}`,
            );
        });

        it('should use email from user-service', async () => {
            const mockDate = new Date('2022-03-25T14:00:00.000Z');
            jest.useFakeTimers().setSystemTime(mockDate);
            mockBuildUnsubscribeUrl.mockResolvedValue(
                new URL('http://localhost:3001/unsubscribe/id'),
            );

            const mockedFindAllByContentGrantSubscriptionIdResponse = [
                {
                    id: 'mock-subscription-id',
                    contentfulGrantSubscriptionId: 'test-grant-id-1',
                    user: {
                        sub: 'test-sub-1',
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
                'email-from-user-service',
                'mock-env-variable-value',
                {
                    'Name of grant':
                        mockedFindAllUpcomingClosingGrantsResponse[0].fields
                            .grantName,
                    unsubscribeUrl: new URL(
                        'http://localhost:3001/unsubscribe/id',
                    ),
                    'link to specific grant': `${HOST}/grants/${mockedFindAllUpcomingClosingGrantsResponse[0].fields.label}`,
                    date: '20 April 2022',
                },
                `mock-env-variable-value-${Date.toString()}`,
            );
        });
    });

    describe('processNewGrantsNotifications', () => {
        beforeEach(jest.clearAllMocks);

        it('should send a notification to anyone subscribed to the new grants newsletter', async () => {
            const mockDate = new Date('2022-03-25T14:00:00.000Z');
            const mockDateMinus7Days = new Date('2022-03-18T00:00:00.000Z');
            jest.useFakeTimers().setSystemTime(mockDate);
            mockBuildUnsubscribeUrl.mockResolvedValue(
                new URL('http://localhost:3001/unsubscribe/id'),
            );

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
                    unsubscribeUrl: new URL(
                        'http://localhost:3001/unsubscribe/id',
                    ),
                    'Link to new grant summary page': expectedLink,
                },
                `${NEW_GRANTS_EMAIL_TEMPLATE_ID}-${mockDate.toISOString()}`,
            );
        });

        it('should not throw error when user service email response is empty', async () => {
            mockGetUserServiceEmailsBySubBatch.mockImplementation(() => [
                { sub: 'not the same test-sub-1' },
            ]);

            const mockDate = new Date('2022-03-25T14:00:00.000Z');
            const mockDateMinus7Days = new Date('2022-03-18T00:00:00.000Z');
            jest.useFakeTimers().setSystemTime(mockDate);
            mockBuildUnsubscribeUrl.mockResolvedValue(
                new URL('http://localhost:3001/unsubscribe/id'),
            );

            const testGrantId1 = 'test-grant-id-1';
            const mockNewsletter = {
                id: 1,
                type: NewsletterType.NEW_GRANTS,
                updatedAt: new Date('2022-03-25T14:00:00.000Z'),
                createdAt: new Date('2022-06-25T14:00:00.000Z'),
                user: {
                    sub: 'test-sub-1',
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
                    unsubscribeUrl: new URL(
                        'http://localhost:3001/unsubscribe/id',
                    ),
                    'Link to new grant summary page': expectedLink,
                },
                `${NEW_GRANTS_EMAIL_TEMPLATE_ID}-${mockDate.toISOString()}`,
            );
        });

        it('should use email from user-service', async () => {
            mockGetUserServiceEmailsBySubBatch.mockImplementation(() => [
                {
                    emailAddress: 'email-from-user-service',
                    sub: 'test-sub-1',
                },
            ]);
            const mockDate = new Date('2022-03-25T14:00:00.000Z');
            const mockDateMinus7Days = new Date('2022-03-18T00:00:00.000Z');
            jest.useFakeTimers().setSystemTime(mockDate);
            mockBuildUnsubscribeUrl.mockResolvedValue(
                new URL('http://localhost:3001/unsubscribe/id'),
            );

            const testGrantId1 = 'test-grant-id-1';
            const mockNewsletter = {
                id: 1,
                type: NewsletterType.NEW_GRANTS,
                updatedAt: new Date('2022-03-25T14:00:00.000Z'),
                createdAt: new Date('2022-06-25T14:00:00.000Z'),
                user: {
                    sub: 'test-sub-1',
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
                'email-from-user-service',
                NEW_GRANTS_EMAIL_TEMPLATE_ID,
                {
                    unsubscribeUrl: new URL(
                        'http://localhost:3001/unsubscribe/id',
                    ),
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
});
