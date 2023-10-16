import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DateTime } from 'luxon';
import { EmailService } from '../../email/email.service';
import { GrantService } from '../../grant/grant.service';
import { SavedSearchService } from '../../saved_search/saved_search.service';
import { SavedSearchNotificationService } from '../../saved_search_notification/saved_search_notification.service';
import { FilterArray, NOTIFICATION_TYPES } from '../notifications.types';
import {
    NotificationsHelper,
    addSearchTerm,
    buildSearchFilterArray,
    extractEmailFromBatchResponse,
} from './notification.helper';

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

    async processSavedSearchMatches() {
        console.log('Running process new saved search matches...');

        const startTime = performance.now();

        const yesterday = DateTime.now().minus({ days: 1 }).startOf('day');
        const newGrants = await this.grantService.findGrantsPublishedAfterDate(
            yesterday.toJSDate(),
        );

        console.log(
            `Number of grants added since ${yesterday.toJSDate()}: ${
                newGrants ? newGrants.length : 0
            }`,
        );

        if (newGrants.length > 0) {
            const savedSearches =
                await this.savedSearchService.findAllConfirmedSearchesWhereDateRangeIsNullOrOverlaps(
                    yesterday.toJSDate(),
                );

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
            }

            const endTime = performance.now();

            console.log(
                `Number of saved saved searches to process: ${
                    savedSearches ? savedSearches.length : 0
                }`,
            );
            console.log(
                `Number of saved search notifications created: ${numberOfSearchesWithMatches}`,
            );
            console.log(
                `Task took ${endTime - startTime} milliseconds to run \r\n`,
            );
        }
    }

    async processSavedSearchMatchesNotifications() {
        console.log('Running Process Saved Search Matches Notifications...');

        const startTime = performance.now();

        const reference = `${
            this.SAVED_SEARCH_NOTIFICATION_EMAIL_TEMPLATE_ID
        }-${new Date().toISOString()}`;
        const notifications =
            await this.savedSearchNotificationService.getAllSavedSearchNotifications();

        const batchesCount = this.notificationsHelper.bacthJobCalc(
            notifications.length,
        );

        for (let i = 0; i < batchesCount; i++) {
            const batch = this.notificationsHelper.getBatchFromObjectArray(
                notifications,
                i,
                batchesCount,
            );

            const userServiceSubEmailMap =
                await this.notificationsHelper.getUserServiceEmailsBySubBatch(
                    batch.map((notification) => notification.user.sub),
                );

            for (const notification of batch) {
                const unsubscribeUrl =
                    this.notificationsHelper.buildUnsubscribeUrl({
                        id: notification.savedSearch.id,
                        emailAddress: notification.user.encryptedEmailAddress,
                        type: NOTIFICATION_TYPES.SAVED_SEARCH,
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
                    reference,
                );

                notification.emailSent = true;
                await this.savedSearchNotificationService.updateSavedSearchNotification(
                    notification,
                );
            }
            console.log(
                `Number of emails sent: ${
                    notifications ? notifications.length : 0
                }`,
            );

            await this.savedSearchNotificationService.deleteSentSavedSearchNotifications();
            console.log(
                `saved search notifications temp table has been cleared`,
            );

            const endTime = performance.now();
            console.log(
                `Task took ${endTime - startTime} milliseconds to run \r\n`,
            );
        }
    }
}
