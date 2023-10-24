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
        private schedularRegistry: SchedulerRegistry,
    ) {}

    async processGrantUpdatedNotifications() {
        return this.v2GrantService.processGrantUpdatedNotifications();
    }

    async processGrantUpcomingNotifications() {
        return this.v2GrantService.processGrantUpcomingNotifications();
    }

    async processNewGrantsNotifications() {
        return this.v2GrantService.processNewGrantsNotifications();
    }

    async processSavedSearchMatches() {
        return this.v2SavedSearchService.processSavedSearchMatches();
    }

    async processSavedSearchMatchesNotifications() {
        return this.v2SavedSearchService.processSavedSearchMatchesNotifications();
    }

    async processScheduledJob({ timer, type }: ScheduledJob, index: number) {
        const CRON_JOB_MAP = {
            [ScheduledJobType.GRANT_UPDATED]:
                this.processGrantUpdatedNotifications.bind(this),
            [ScheduledJobType.GRANT_UPCOMING]:
                this.processGrantUpcomingNotifications.bind(this),
            [ScheduledJobType.NEW_GRANTS]:
                this.processNewGrantsNotifications.bind(this),
            [ScheduledJobType.SAVED_SEARCH_MATCHES]:
                this.processSavedSearchMatches.bind(this),
            [ScheduledJobType.SAVED_SEARCH_MATCHES_NOTIFICATION]:
                this.processSavedSearchMatchesNotifications.bind(this),
        };
        const cronFn = CRON_JOB_MAP[type as keyof typeof CRON_JOB_MAP];
        const cronJob = getCronJob(cronFn, timer);
        this.schedularRegistry.addCronJob(`${type}_${index}`, cronJob);
        cronJob.start();
    }
}
