import { SchedulerLockService } from 'src/scheduler/scheduler-lock.service';
import {
    ScheduledJob,
    ScheduledJobType,
} from '../../scheduler/scheduled-job.entity';
import { GrantNotificationsService } from './notifications.grant.service';
import { getCronJob } from './notifications.helper';
import { SavedSearchNotificationsService } from './notifications.savedSearch.service';
import { Injectable } from '@nestjs/common';
import { SchedulerRegistry } from '@nestjs/schedule';

@Injectable()
export class v2NotificationsService {
    constructor(
        private v2GrantService: GrantNotificationsService,
        private v2SavedSearchService: SavedSearchNotificationsService,
        private schedulerLockService: SchedulerLockService,
        private schedulerRegistry: SchedulerRegistry,
    ) {}

    private CRON_JOB_MAP = {
        [ScheduledJobType.GRANT_UPDATED]:
            this.v2GrantService.processGrantUpdatedNotifications,
        [ScheduledJobType.GRANT_UPCOMING]:
            this.v2GrantService.processGrantUpcomingNotifications,
        [ScheduledJobType.NEW_GRANTS]:
            this.v2GrantService.processNewGrantsNotifications,
        [ScheduledJobType.SAVED_SEARCH_MATCHES]:
            this.v2SavedSearchService.processSavedSearchMatches,
        [ScheduledJobType.SAVED_SEARCH_MATCHES_NOTIFICATION]:
            this.v2SavedSearchService.processSavedSearchMatchesNotifications,
    };

    private async callProcessFnWithTransactionLock(
        fn: () => Promise<void>,
        type: ScheduledJobType,
    ) {
        const isLocked =
            await this.schedulerLockService.checkAndSetTransactionLock(type);
        if (isLocked) return;

        await fn().catch((err: unknown) =>
            console.error(
                `Error processing scheduled job with type: ${type}`,
                err,
            ),
        );
        await this.schedulerLockService.unlock(type);
    }

    processScheduledJob({ timer, type }: ScheduledJob, index: number) {
        const cronFn = async () =>
            await this.callProcessFnWithTransactionLock(
                this.CRON_JOB_MAP[type as keyof typeof this.CRON_JOB_MAP],
                type,
            );

        const cronJob = getCronJob(cronFn, timer);
        this.schedulerRegistry.addCronJob(`${type}_${index}`, cronJob);
        cronJob.start();
    }
}
