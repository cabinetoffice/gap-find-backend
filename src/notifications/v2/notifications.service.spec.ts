import { SchedulerRegistry } from '@nestjs/schedule';
import { Test, TestingModule } from '@nestjs/testing';
import { SavedSearchNotificationsService } from './notifications.savedSearch.service';
import { GrantNotificationsService } from './notifications.grant.service';
import { v2NotificationsService } from './notifications.service';

const mockedCronStart = jest.fn();

jest.mock('./notifications.helper', () => ({
    getCronJob: (fn: () => Promise<void>, timer: string) => ({
        mockedCronJob: [fn, timer],
        start: mockedCronStart,
    }),
}));

describe('NotificationsService', () => {
    let serviceUnderTest: v2NotificationsService;
    let grantService: GrantNotificationsService;
    let savedSearchService: SavedSearchNotificationsService;
    let schedulerRegistry: SchedulerRegistry;

    const mockProcessGrantUpdatedNotifications = jest.fn();
    const mockProcessGrantUpcomingNotifications = jest.fn();
    const mockProcessNewGrantsNotifications = jest.fn();
    const mockProcessSavedSearchMatches = jest.fn();
    const mockProcessSavedSearchMatchesNotifications = jest.fn();

    const timer = '* * * * *';

    beforeAll(async () => {
        const module: TestingModule = await Test.createTestingModule({
            imports: [],
            providers: [
                v2NotificationsService,
                GrantNotificationsService,
                SavedSearchNotificationsService,
                SchedulerRegistry,
                {
                    provide: GrantNotificationsService,
                    useValue: {
                        processGrantUpcomingNotifications:
                            mockProcessGrantUpcomingNotifications,
                        processNewGrantsNotifications:
                            mockProcessNewGrantsNotifications,
                        processGrantUpdatedNotifications:
                            mockProcessGrantUpdatedNotifications,
                    },
                },
                {
                    provide: SavedSearchNotificationsService,
                    useValue: {
                        processSavedSearchMatches:
                            mockProcessSavedSearchMatches,
                        processSavedSearchMatchesNotifications:
                            mockProcessSavedSearchMatchesNotifications,
                    },
                },
            ],
            controllers: [],
        }).compile();
        serviceUnderTest = module.get<v2NotificationsService>(
            v2NotificationsService,
        );
        grantService = module.get<GrantNotificationsService>(
            GrantNotificationsService,
        );
        savedSearchService = module.get<SavedSearchNotificationsService>(
            SavedSearchNotificationsService,
        );
        schedulerRegistry = module.get<SchedulerRegistry>(SchedulerRegistry);
    });

    it.each`
        type                                   | expectedFn
        ${'GRANT_UPDATED'}                     | ${mockProcessGrantUpdatedNotifications}
        ${'GRANT_UPCOMING'}                    | ${mockProcessGrantUpcomingNotifications}
        ${'NEW_GRANTS'}                        | ${mockProcessNewGrantsNotifications}
        ${'SAVED_SEARCH_MATCHES'}              | ${mockProcessSavedSearchMatches}
        ${'SAVED_SEARCH_MATCHES_NOTIFICATION'} | ${mockProcessSavedSearchMatchesNotifications}
    `(
        'processScheduledJob should call the correct service function for $type',
        async ({ type, expectedFn }) => {
            await serviceUnderTest.processScheduledJob(
                {
                    id: 1,
                    timer,
                    type,
                },
                1,
            );

            expect(schedulerRegistry.addCronJob).toHaveBeenCalledWith(
                `${type}_1`,
                {
                    mockedCronJob: [expectedFn, timer],
                    start: mockedCronStart,
                },
            );
            expect(mockedCronStart).toHaveBeenCalled();
        },
    );
});
