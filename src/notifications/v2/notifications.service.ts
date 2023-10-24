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

    processScheduledJob({ timer, type }: ScheduledJob, index: number) {
        const CRON_JOB_MAP = {
            [ScheduledJobType.GRANT_UPDATED]:
                this.v2GrantService.processGrantUpdatedNotifications,
            [ScheduledJobType.GRANT_UPCOMING]:
                this.v2GrantService.processGrantUpcomingNotifications,
            [ScheduledJobType.NEW_GRANTS]:
                this.v2GrantService.processNewGrantsNotifications,
            [ScheduledJobType.SAVED_SEARCH_MATCHES]:
                this.v2SavedSearchService.processSavedSearchMatches,
            [ScheduledJobType.SAVED_SEARCH_MATCHES_NOTIFICATION]:
                this.v2SavedSearchService
                    .processSavedSearchMatchesNotifications,
        };
        const cronFn = CRON_JOB_MAP[type as keyof typeof CRON_JOB_MAP];
        const cronJob = getCronJob(cronFn, timer);
        this.schedularRegistry.addCronJob(`${type}_${index}`, cronJob);
        cronJob.start();
    }
}
