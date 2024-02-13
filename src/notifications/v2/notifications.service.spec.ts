import { SchedulerRegistry } from '@nestjs/schedule';
import { Test, TestingModule } from '@nestjs/testing';
import { SavedSearchNotificationsService } from './notifications.savedSearch.service';
import { GrantNotificationsService } from './notifications.grant.service';
import { v2NotificationsService } from './notifications.service';
import { SchedulerLockService } from '../../scheduler/scheduler-lock.service';
import { ScheduledJob } from '../../scheduler/scheduled-job.entity';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

const mockedCronStart = jest.fn();

jest.mock('./notifications.helper', () => ({
    getCronJob: (fn: () => Promise<void>, timer: string) => ({
        mockedCronJob: [fn, timer],
        start: mockedCronStart,
    }),
}));

describe('NotificationsService', () => {
    let serviceUnderTest: v2NotificationsService;
    let schedulerRegistry: SchedulerRegistry;

    const mockProcessGrantUpdatedNotifications = jest
        .fn()
        .mockImplementation(() => Promise.resolve());
    const mockProcessGrantUpcomingNotifications = jest
        .fn()
        .mockImplementation(() => Promise.resolve());
    const mockProcessNewGrantsNotifications = jest
        .fn()
        .mockImplementation(() => Promise.resolve());
    const mockProcessSavedSearchMatches = jest
        .fn()
        .mockImplementation(() => Promise.resolve());
    const mockProcessSavedSearchMatchesNotifications = jest
        .fn()
        .mockImplementation(() => Promise.resolve());

    const timer = '* * * * *';

    const mockUnlock = jest.fn();

    const mockSchedulerLockService = {
        provide: SchedulerLockService,
        useValue: {
            checkAndSetTransactionLock: jest.fn(),
            unlock: mockUnlock,
            Connection: jest.fn(),
        },
    };

    beforeAll(async () => {
        const module: TestingModule = await Test.createTestingModule({
            imports: [],
            providers: [
                v2NotificationsService,
                GrantNotificationsService,
                SavedSearchNotificationsService,
                mockSchedulerLockService,
                SchedulerRegistry,
                {
                    provide: SchedulerRegistry,
                    useValue: { addCronJob: jest.fn() },
                },
                {
                    provide: getRepositoryToken(ScheduledJob),
                    useValue: {},
                },
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
        schedulerRegistry = module.get<SchedulerRegistry>(SchedulerRegistry);
    });

    it.each`
        type
        ${'GRANT_UPDATED'}
        ${'GRANT_UPCOMING'}
        ${'NEW_GRANTS'}
        ${'SAVED_SEARCH_MATCHES'}
        ${'SAVED_SEARCH_MATCHES_NOTIFICATION'}
    `('processScheduledJob should start cron with $type', async ({ type }) => {
        serviceUnderTest.processScheduledJob(
            {
                id: 1,
                timer,
                type,
                locked: false,
            },
            1,
        );

        expect(schedulerRegistry.addCronJob).toHaveBeenCalledWith(`${type}_1`, {
            mockedCronJob: [expect.any(Function), timer],
            start: mockedCronStart,
        });
        expect(mockedCronStart).toHaveBeenCalled();
    });

    it.each`
        type                                   | expectedFn                                    | isLocked
        ${'GRANT_UPDATED'}                     | ${mockProcessGrantUpdatedNotifications}       | ${true}
        ${'GRANT_UPCOMING'}                    | ${mockProcessGrantUpcomingNotifications}      | ${true}
        ${'NEW_GRANTS'}                        | ${mockProcessNewGrantsNotifications}          | ${true}
        ${'SAVED_SEARCH_MATCHES'}              | ${mockProcessSavedSearchMatches}              | ${true}
        ${'SAVED_SEARCH_MATCHES_NOTIFICATION'} | ${mockProcessSavedSearchMatchesNotifications} | ${true}
        ${'GRANT_UPDATED'}                     | ${mockProcessGrantUpdatedNotifications}       | ${false}
        ${'GRANT_UPCOMING'}                    | ${mockProcessGrantUpcomingNotifications}      | ${false}
        ${'NEW_GRANTS'}                        | ${mockProcessNewGrantsNotifications}          | ${false}
        ${'SAVED_SEARCH_MATCHES'}              | ${mockProcessSavedSearchMatches}              | ${false}
        ${'SAVED_SEARCH_MATCHES_NOTIFICATION'} | ${mockProcessSavedSearchMatchesNotifications} | ${false}
    `(
        'checkAndSetTranactionLock should call fns for type: $type & isLocked: $isLocked',
        async ({ type, expectedFn, isLocked }) => {
            mockSchedulerLockService.useValue.checkAndSetTransactionLock.mockResolvedValue(
                isLocked,
            );
            await serviceUnderTest.callProcessFnWithTransactionLock({
                fn: expectedFn,
                type,
            });

            if (isLocked) {
                expect(expectedFn).not.toHaveBeenCalled();
                expect(mockUnlock).not.toHaveBeenCalled();
            } else {
                expect(mockUnlock).toHaveBeenCalledWith(type);
                expect(expectedFn).toHaveBeenCalled();
            }
        },
    );
});
