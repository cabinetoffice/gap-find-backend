import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { GrantService } from '../grant/grant.service';
import { EmailService } from '../email/email.service';
import { SubscriptionService } from '../subscription/subscription.service';
import { NotificationsService } from './notifications.service';
import { ContentfulService } from '../contentful/contentful.service';
import { NewsletterService } from '../newsletter/newsletter.service';
import { NewsletterType } from '../newsletter/newsletter.entity';
import { DateTime } from 'luxon';

describe('NotificationsService', () => {
    let serviceUnderTest: NotificationsService;
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
        }).compile();

        serviceUnderTest =
            module.get<NotificationsService>(NotificationsService);
        grantService = module.get<GrantService>(GrantService);
        emailService = module.get<EmailService>(EmailService);
        subscriptionService =
            module.get<SubscriptionService>(SubscriptionService);
        newsletterService = module.get<NewsletterService>(NewsletterService);
    });

    it('should be defined', () => {
        expect(serviceUnderTest).toBeDefined();
    });

    describe('processGrantUpdatedNotifications', () => {
        beforeEach(() => {
            jest.clearAllMocks();
        });

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
                    emailAddress: testEmail1,
                },
            };

            const testSubscription2 = {
                contentfulGrantSubscriptionId: testGrantId1,
                user: {
                    emailAddress: testEmail2,
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
                testSubscription1.user.emailAddress,
                'mock-env-variable-value',
                {
                    'name of grant': testContentfulGrant1.fields.grantName,
                    'link to specific grant': `${HOST}/grants/${testContentfulGrant1.fields.label}`,
                },
                'mock-env-variable-value-2022-03-25T14:00:00.000Z',
            );
            expect(emailService.send).toHaveBeenNthCalledWith(
                2,
                testSubscription2.user.emailAddress,
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
                        emailAddress: 'mock-email-address',
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
                mockedFindAllByContentGrantSubscriptionIdResponse[0].user
                    .emailAddress,
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
                    emailAddress: 'test@test.com',
                    hashedEmailAddress: 'hashed-email',
                    encryptedEmailAddress: 'encrypted-email',
                    updatedAt: new Date('2022-03-25T14:00:00.000Z'),
                    createdAt: new Date('2022-06-25T14:00:00.000Z'),
                    subscriptions: [],
                    newsletterSubscriptions: [],
                },
            };
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
                mockNewsletter.user.emailAddress,
                NEW_GRANTS_EMAIL_TEMPLATE_ID,
                {
                    "Link to new grant summary page": expectedLink,
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
