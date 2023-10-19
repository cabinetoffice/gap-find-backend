import {
    ScheduledJob,
    ScheduledJobType,
} from 'src/scheduler/scheduled-job.entity';
import { GrantNotificationsService } from './notifications.grants.service';
import { SavedSearchNotificationsService } from './notifications.savedSearch.service';
import { Injectable } from '@nestjs/common';
import { SchedulerRegistry } from '@nestjs/schedule';
import { CronJob } from 'cron';

@Injectable()
export class v2NotificationsService {
    constructor(
        private v2GrantService: GrantNotificationsService,
        private v2SavedSearchService: SavedSearchNotificationsService,
        private schedularRegistry: SchedulerRegistry,
    ) {}

    async processScheduledJob(job: ScheduledJob, index: number) {
        const map = {
            [ScheduledJobType.GRANT_UPDATED]: () =>
                this.v2GrantService.processGrantUpdatedNotifications(),
            [ScheduledJobType.GRANT_UPCOMING]: () =>
                this.v2GrantService.processGrantUpcomingNotifications(),
            [ScheduledJobType.NEW_GRANTS]: () =>
                this.v2GrantService.processNewGrantsNotifications(),
            [ScheduledJobType.SAVED_SEARCH_MATCHES]: () =>
                this.v2SavedSearchService.processSavedSearchMatches(),
            [ScheduledJobType.SAVED_SEARCH_MATCHES_NOTIFICATION]: () =>
                this.v2SavedSearchService.processSavedSearchMatchesNotifications(),
        };
        const fn = map[job.type as keyof typeof map];
        const cron = getCronJob(fn, job.timer);
        this.schedularRegistry.addCronJob(job.type + '_' + index, cron);
        cron.start();
    }
}

const getCronJob = (fn: () => void, timer: string) => {
    return new CronJob(timer, fn);
};
