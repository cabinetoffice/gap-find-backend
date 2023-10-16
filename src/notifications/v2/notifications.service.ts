import {
    ScheduledJob,
    ScheduledJobType,
} from 'src/scheduler/scheduled-job.entity';
import { GrantNotificationsService } from './grant.service';
import { SavedSearchNotificationsService } from './savedsearch.service';
import { Injectable } from '@nestjs/common';
import { SchedulerRegistry } from '@nestjs/schedule';
import { CronJob } from 'cron';
import { time } from 'console';

@Injectable()
export class v2NotificationsService {
    constructor(
        private v2GrantService: GrantNotificationsService,
        private v2SavedSearchService: SavedSearchNotificationsService,
        private schedularRegistry: SchedulerRegistry,
    ) {}

    async processScheduledJob(job: ScheduledJob, index: number) {
        // switch (job) {
        //     case ScheduledJobType.GRANT_UPDATED:
        //         return processGrantUpdatedNotifications();
        //     case ScheduledJobType.GRANT_UPCOMING:
        //         return processGrantUpcomingNotifications();
        //     case ScheduledJobType.NEW_GRANTS:
        //         return processNewGrantsNotifications();
        //     case ScheduledJobType.SAVED_SEARCH_MATCHES:
        //         return processSavedSearchMatches();
        // }
        const map = {
            [ScheduledJobType.GRANT_UPDATED]: () =>
                this.v2GrantService.processGrantUpdatedNotifications(),
        };
        // [ScheduledJobType.GRANT_UPCOMING]: processGrantUpcomingNotifications,
        // [ScheduledJobType.NEW_GRANTS]: processNewGrantsNotifications,
        // [ScheduledJobType.SAVED_SEARCH_MATCHES]: processSavedSearchMatches,
        const fn = map[job.type as keyof typeof map];
        const cron = getCronJob(fn, job.timer);
        this.schedularRegistry.addCronJob(job.type + '_' + index, cron);
        cron.start();
    }
}

const getCronJob = (fn: () => void, timer: string) => {
    return new CronJob(timer, fn);
};
