import { ScheduledJobType } from 'src/scheduler/scheduled-job.entity';
//import { GrantNotificationsService } from './grant.service';
//import { SavedSearchNotificationsService } from './savedsearch.service';
import { Injectable } from '@nestjs/common';

@Injectable()
export class v2NotificationsService {
    constructor(
      //  private v2GrantService: GrantNotificationsService,
      //  private v2SavedSearchService: SavedSearchNotificationsService,
    ) {}

    async processScheduledJob(job: ScheduledJobType) {
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
            [ScheduledJobType.GRANT_UPDATED]: () => {
                console.log('Testy mc test face');
            },
            // [ScheduledJobType.GRANT_UPCOMING]: processGrantUpcomingNotifications,
            // [ScheduledJobType.NEW_GRANTS]: processNewGrantsNotifications,
            // [ScheduledJobType.SAVED_SEARCH_MATCHES]: processSavedSearchMatches,
        };
        map[job as keyof typeof map]();
    }
}
