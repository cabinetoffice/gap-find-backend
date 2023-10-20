import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DateTime } from 'luxon';
import { ContentfulService } from '../contentful/contentful.service';
import { EmailService } from '../email/email.service';
import { ELASTIC_INDEX_FIELDS } from '../grant/grant.constants';
import { GrantService } from '../grant/grant.service';
import { NewsletterType } from '../newsletter/newsletter.entity';
import { NewsletterService } from '../newsletter/newsletter.service';
import { Filter, SavedSearch } from '../saved_search/saved_search.entity';
import { SavedSearchService } from '../saved_search/saved_search.service';
import { SavedSearchNotificationService } from '../saved_search_notification/saved_search_notification.service';
import { SubscriptionService } from '../subscription/subscription.service';
import { FilterArray } from './notifications.types';
import { NotificationsHelper } from './v2/notifications.helper';

@Injectable()
export class NotificationsService {
    private GRANT_UPDATED_TEMPLATE_ID: string;
    private GRANT_CLOSING_TEMPLATE_ID: string;
    private GRANT_OPENING_TEMPLATE_ID: string;
    private NEW_GRANTS_EMAIL_TEMPLATE_ID: string;
    private SAVED_SEARCH_NOTIFICATION_EMAIL_TEMPLATE_ID: string;
    private HOST: string;

    constructor(
        private grantService: GrantService,
        private subscriptionService: SubscriptionService,
        private emailService: EmailService,
        private configService: ConfigService,
        private contentfulService: ContentfulService,
        private newsletterService: NewsletterService,
        private savedSearchService: SavedSearchService,
        private savedSearchNotificationService: SavedSearchNotificationService,
        private notificationsHelper: NotificationsHelper,
    ) {
        this.GRANT_UPDATED_TEMPLATE_ID = this.configService.get<string>(
            'GOV_NOTIFY_GRANT_UPDATED_EMAIL_TEMPLATE_ID',
        );
        this.GRANT_CLOSING_TEMPLATE_ID = this.configService.get<string>(
            'GOV_NOTIFY_GRANT_CLOSING_EMAIL_TEMPLATE_ID',
        );
        this.GRANT_OPENING_TEMPLATE_ID = this.configService.get<string>(
            'GOV_NOTIFY_GRANT_OPENING_EMAIL_TEMPLATE_ID',
        );
        this.NEW_GRANTS_EMAIL_TEMPLATE_ID = this.configService.get<string>(
            'GOV_NOTIFY_NEW_GRANTS_EMAIL_TEMPLATE_ID',
        );
        this.SAVED_SEARCH_NOTIFICATION_EMAIL_TEMPLATE_ID =
            this.configService.get<string>(
                'GOV_NOTIFY_SAVED_SEARCH_NOTIFICATION_EMAIL_TEMPLATE_ID',
            );
        this.HOST = this.configService.get<string>('HOST');
    }

    async processGrantUpdatedNotifications() {
        console.log('Running Process Grant Updated Notifications...');
        console.log('Running Process Grant Updated Notifications.. OLD ONE.');
        const reference = `${
            this.GRANT_UPDATED_TEMPLATE_ID
        }-${new Date().toISOString()}`;
        const grantIds = await this.grantService.findAllUpdatedGrants();
        for (const grantId of grantIds) {
            const subscriptions =
                await this.subscriptionService.findAllByContentGrantSubscriptionId(
                    grantId,
                );
            for (const subscription of subscriptions) {
                const unsubscribeUrl =
                    await this.notificationsHelper.buildUnsubscribeUrl({
                        subscriptionId: grantId,
                        user: subscription.user,
                    });

                const contentfulGrant = await this.contentfulService.fetchEntry(
                    grantId,
                );

                const personalisation = {
                    unsubscribeUrl,
                    'name of grant': contentfulGrant.fields.grantName as string,
                    'link to specific grant': `${this.HOST}/grants/${contentfulGrant.fields.label}`,
                };

                this.emailService.send(
                    await subscription.user.decryptEmail(),
                    this.GRANT_UPDATED_TEMPLATE_ID,
                    personalisation,
                    reference,
                );
            }
        }
        const update = {
            grantUpdated: {
                'en-US': false,
            },
        };
        await this.contentfulService.updateEntries(grantIds, update);
    }

    async processGrantUpcomingNotifications() {
        console.log('Running Process Grant Upcoming Notifications...');
        const grants = [
            ...(await this.grantService.findAllUpcomingClosingGrants()),
            ...(await this.grantService.findAllUpcomingOpeningGrants()),
        ];

        const reference = `${
            this.GRANT_CLOSING_TEMPLATE_ID
        }-${Date.toString()}`;
        for (const grant of grants) {
            const grantId = grant.sys.id;
            const subscriptions =
                await this.subscriptionService.findAllByContentGrantSubscriptionId(
                    grantId,
                );
            for (const subscription of subscriptions) {
                const unsubscribeUrl =
                    await this.notificationsHelper.buildUnsubscribeUrl({
                        subscriptionId: grantId,
                        user: subscription.user,
                    });

                const grantEventDate = new Date(
                    grant.closing
                        ? grant.fields.grantApplicationCloseDate
                        : grant.fields.grantApplicationOpenDate,
                );
                const personalisation = {
                    unsubscribeUrl,
                    'Name of grant': grant.fields.grantName,
                    'link to specific grant': `${this.HOST}/grants/${grant.fields.label}`,
                    date: grantEventDate.toLocaleString('en-GB', {
                        timeZone: 'UTC',
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                    }),
                };

                this.emailService.send(
                    await subscription.user.decryptEmail(),
                    grant.closing
                        ? this.GRANT_CLOSING_TEMPLATE_ID
                        : this.GRANT_OPENING_TEMPLATE_ID,
                    personalisation,
                    reference,
                );
            }
        }
    }

    async processNewGrantsNotifications() {
        console.log('Running Process New Grants Notifications...');
        const reference = `${
            this.NEW_GRANTS_EMAIL_TEMPLATE_ID
        }-${new Date().toISOString()}`;
        const last7days = DateTime.now().minus({ days: 7 }).startOf('day');
        const today = DateTime.now();

        const newGrants = await this.grantService.findGrantsPublishedAfterDate(
            last7days.toJSDate(),
        );
        if (newGrants.length > 0) {
            const newsletters = await this.newsletterService.findAllByType(
                NewsletterType.NEW_GRANTS,
            );

            const personalisation = {
                'Link to new grant summary page': new URL(
                    `grants?searchTerm=&from-day=${last7days.day}&from-month=${last7days.month}&from-year=${last7days.year}&to-day=${today.day}&to-month=${today.month}&to-year=${today.year}`,
                    this.HOST,
                ),
            };
            for (const newsletter of newsletters) {
                const unsubscribeUrl =
                    await this.notificationsHelper.buildUnsubscribeUrl({
                        newsletterId: NewsletterType.NEW_GRANTS,
                        user: newsletter.user,
                    });

                await this.emailService.send(
                    await newsletter.user.decryptEmail(),
                    this.NEW_GRANTS_EMAIL_TEMPLATE_ID,
                    { ...personalisation, unsubscribeUrl },
                    reference,
                );
            }
        }
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
                const filterArray: FilterArray = this.buildSearchFilterArray(
                    savedSearch,
                    yesterday.toJSDate(),
                );

                if (savedSearch.search_term) {
                    const searchTerm = this.addSearchTerm(
                        savedSearch.search_term,
                    );
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
        for (const notification of notifications) {
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

            this.emailService.send(
                await notification.user.decryptEmail(),
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
        console.log(`saved search notifications temp table has been cleared`);

        const endTime = performance.now();
        console.log(
            `Task took ${endTime - startTime} milliseconds to run \r\n`,
        );
    }

    private addSearchTerm(searchTerm: string) {
        return {
            multi_match: {
                query: searchTerm,
                operator: 'AND',
                fuzziness: 'AUTO',
                fields: [
                    ELASTIC_INDEX_FIELDS.grantName,
                    ELASTIC_INDEX_FIELDS.summary,
                    ELASTIC_INDEX_FIELDS.eligibility,
                    ELASTIC_INDEX_FIELDS.shortDescription,
                ],
            },
        };
    }

    private addTextFilter(filter: Filter) {
        return {
            match_phrase: {
                [filter.name]: filter.searchTerm,
            },
        };
    }

    private addRangeFilter(filter: Filter) {
        return {
            range: {
                [filter.name]: filter.searchTerm,
            },
        };
    }

    private buildIndividualElasticFilters(selectedFilters: Filter[]) {
        const elasticFilters: (
            | { match_phrase: { [x: string]: string | object } }
            | { range: { [x: string]: string | object } }
        )[] = [];

        selectedFilters.forEach((filter: Filter) => {
            switch (filter.type) {
                case 'text-filter': {
                    const textMatches = this.addTextFilter(filter);
                    elasticFilters.push(textMatches);
                    break;
                }
                case 'range-filter': {
                    const rangeMatches = this.addRangeFilter(filter);
                    elasticFilters.push(rangeMatches);
                    break;
                }
            }
        });

        return elasticFilters;
    }

    private buildSearchFilterArray(
        savedSearch: SavedSearch,
        dateToFilterOn: Date,
    ) {
        const filterArray = [];

        if (savedSearch.filters !== null) {
            const individualFilters = this.buildIndividualElasticFilters(
                savedSearch.filters,
            );

            // hard code the search to only return matches for the specified timeframe
            const dateRangeFilter = this.addRangeFilter({
                searchTerm: {
                    gte: dateToFilterOn,
                },
                name: 'sys.createdAt',
                type: 'range-filter',
                subFilterid: null,
            });
            individualFilters.push(dateRangeFilter);

            const innerQuery = [];
            for (const query in individualFilters) {
                innerQuery.push({
                    bool: {
                        should: individualFilters[query],
                    },
                });
            }

            if (innerQuery.length > 0) {
                filterArray.push({
                    bool: {
                        must: innerQuery,
                    },
                });
            }
        }

        return filterArray;
    }
}
