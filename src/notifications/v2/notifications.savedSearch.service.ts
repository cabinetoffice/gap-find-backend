import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DateTime } from 'luxon';
import { EmailService } from '../../email/email.service';
import { GrantService } from '../../grant/grant.service';
import { SavedSearchService } from '../../saved_search/saved_search.service';
import { SavedSearchNotificationService } from '../../saved_search_notification/saved_search_notification.service';
import { FilterArray } from '../notifications.types';
import {
    NotificationsHelper,
    addSearchTerm,
    buildSearchFilterArray,
    extractEmailFromBatchResponse,
} from './notifications.helper';
import { SavedSearchNotification } from '../../saved_search_notification/saved_search_notification.entity';
import { SavedSearch } from '../../saved_search/saved_search.entity';
import { performance } from 'perf_hooks';

@Injectable()
export class SavedSearchNotificationsService {
    private SAVED_SEARCH_NOTIFICATION_EMAIL_TEMPLATE_ID: string;

    constructor(
        private grantService: GrantService,
        private emailService: EmailService,
        private configService: ConfigService,
        private savedSearchService: SavedSearchService,
        private savedSearchNotificationService: SavedSearchNotificationService,
        private notificationsHelper: NotificationsHelper,
    ) {
        this.SAVED_SEARCH_NOTIFICATION_EMAIL_TEMPLATE_ID =
            this.configService.get<string>(
                'GOV_NOTIFY_SAVED_SEARCH_NOTIFICATION_EMAIL_TEMPLATE_ID',
            );
    }
    private async sendSavedSavedSearchNotificationEmails(
        batch: Array<SavedSearchNotification>,
    ) {
        const userServiceSubEmailMap =
            await this.notificationsHelper.getUserServiceEmailsBySubBatch(
                batch
                    .map((notification) => notification.user.sub)
                    .filter((sub) => sub),
            );

        for (const notification of batch) {
            const unsubscribeUrl =
                await this.notificationsHelper.buildUnsubscribeUrl({
                    savedSearchId: notification.savedSearch.id,
                    user: notification.user,
                });

            const personalisation = {
                unsubscribeUrl,
                'name of saved search': notification.savedSearch.name,
                'link to saved search match': notification.resultsUri,
            };

            const email = extractEmailFromBatchResponse(
                userServiceSubEmailMap,
                notification,
            );

            this.emailService.send(
                email ?? (await notification.user.decryptEmail()),
                this.SAVED_SEARCH_NOTIFICATION_EMAIL_TEMPLATE_ID,
                personalisation,
                `${
                    this.SAVED_SEARCH_NOTIFICATION_EMAIL_TEMPLATE_ID
                }-${new Date().toISOString()}`,
            );

            notification.emailSent = true;
            await this.savedSearchNotificationService.updateSavedSearchNotification(
                notification,
            );
        }
    }

    private createSavedSearchNotifications = async (
        savedSearches: SavedSearch[],
        yesterday: DateTime,
    ) => {
        let numberOfSearchesWithMatches = 0;
        for (const savedSearch of savedSearches) {
            const filterArray: FilterArray = buildSearchFilterArray(
                savedSearch,
                yesterday.toJSDate(),
            );

            if (savedSearch.search_term) {
                const searchTerm = addSearchTerm(savedSearch.search_term);
                filterArray.push(searchTerm);
            }

            const matches =
                await this.grantService.findGrantsMatchingFilterCriteria(
                    filterArray,
                );

            if (matches?.length > 0) {
                numberOfSearchesWithMatches += 1;
                await this.savedSearchNotificationService.createSavedSearchNotification(
                    savedSearch,
                );
            }
            return numberOfSearchesWithMatches;
        }
    };

    processSavedSearchMatches = async () => {
        console.log(
            '[CRON SAVED SEARCH MATCHES] Running process new saved search matches...',
        );

        const startTime = performance.now();

        const yesterday = DateTime.now().minus({ days: 1 }).startOf('day');
        const newGrants = await this.grantService.findGrantsPublishedAfterDate(
            yesterday.toJSDate(),
        );

        console.log(
            `[CRON SAVED SEARCH MATCHES] Number of grants added since ${yesterday.toJSDate()}: ${
                newGrants ? newGrants.length : 0
            }`,
        );

        if (newGrants.length > 0) {
            const savedSearches =
                await this.savedSearchService.findAllConfirmedSearchesWhereDateRangeIsNullOrOverlaps(
                    yesterday.toJSDate(),
                );

            const numberOfSearchesWithMatches =
                await this.createSavedSearchNotifications(
                    savedSearches,
                    yesterday,
                );

            const endTime = performance.now();

            console.log(
                `[CRON SAVED SEARCH MATCHES] Number of saved saved searches to process: ${
                    savedSearches ? savedSearches.length : 0
                }`,
            );
            console.log(
                `[CRON SAVED SEARCH MATCHES] Number of saved search notifications created: ${numberOfSearchesWithMatches}`,
            );
            console.log(
                `[CRON SAVED SEARCH MATCHES] Task took ${
                    endTime - startTime
                } milliseconds to run \r\n`,
            );
        }
    };

    processSavedSearchMatchesNotifications = async () => {
        console.log(
            '[CRON SAVED SEARCH MATCHES NOTIFICATIONS] Running Process Saved Search Matches Notifications...',
        );
        let emailsSent = 0;

        const startTime = performance.now();

        const notifications =
            await this.savedSearchNotificationService.getAllSavedSearchNotifications();

        const batchesCount =
            this.notificationsHelper.getNumberOfBatchesOfNotifications(
                notifications.length,
            );

        for (let i = 0; i < batchesCount; i++) {
            const batch = this.notificationsHelper.getBatchFromObjectArray(
                notifications,
                i,
                batchesCount,
            ) as SavedSearchNotification[];

            await this.sendSavedSavedSearchNotificationEmails(batch);
            await this.savedSearchNotificationService.deleteSentSavedSearchNotifications();
            console.log(
                `[CRON SAVED SEARCH MATCHES NOTIFICATIONS] Task took ${
                    performance.now() - startTime
                } milliseconds to run \r\n`,
            );
            emailsSent += batch.length;
        }
        console.log(
            `[CRON SAVED SEARCH MATCHES NOTIFICATIONS] Finished sending saved search emails, sent ${emailsSent} emails`,
        );
    };
}
