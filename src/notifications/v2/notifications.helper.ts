import { Filter, SavedSearch } from 'src/saved_search/saved_search.entity';
import { V2BuildNotificationProps } from '../notifications.types';
import { ELASTIC_INDEX_FIELDS } from '../../grant/grant.constants';
import axios from 'axios';
import { User } from 'src/user/user.entity';
import { ConfigService } from '@nestjs/config';
import { Injectable } from '@nestjs/common';
import { UnsubscribeService } from './unsubscribe/unsubscribe.service';
import { EncryptionServiceV2 } from '../../encryption/encryptionV2.service';
import { CronJob } from 'cron';
import { Subscription } from 'src/subscription/subscription.entity';
import { Newsletter } from 'src/newsletter/newsletter.entity';
import { SavedSearchNotification } from '../../saved_search_notification/saved_search_notification.entity';

const GRANT_SUBSCRIPTION = 'GRANT_SUBSCRIPTION';
const NEWSLETTER = 'NEWSLETTER';
const SAVED_SEARCH = 'SAVED_SEARCH';

@Injectable()
export class NotificationsHelper {
    private FRONT_END_HOST: string;
    private USER_SERVICE_URL: string;
    private SUBSCRIPTIONS_PER_BATCH: number;
    private LAMBDA_SECRET: string;

    constructor(
        private configService: ConfigService,
        private unsubscribeService: UnsubscribeService,
        private encryptionServiceV2: EncryptionServiceV2,
    ) {
        this.FRONT_END_HOST = this.configService.get<string>('FRONT_END_HOST');
        this.USER_SERVICE_URL =
            this.configService.get<string>('USER_SERVICE_URL');
        this.SUBSCRIPTIONS_PER_BATCH = this.configService.get<number>(
            'SUBSCRIPTIONS_PER_BATCH',
        );
        this.LAMBDA_SECRET = this.configService.get<string>('LAMBDA_SECRET');
    }

    async getUserServiceEmailsBySubBatch(batchOfSubs: string[]) {
        console.log(this.LAMBDA_SECRET);
        const response = await axios.post(
            this.USER_SERVICE_URL + '/users/emails',
            batchOfSubs,
            {
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: await this.encryptionServiceV2.encryptV2(
                        this.LAMBDA_SECRET,
                    ),
                },
            },
        );

        const data = await Promise.all(
            response.data.map(async (emailDTO: EmailDTO) => {
                const decryptedEmail = await this.encryptionServiceV2.decryptV2(
                    emailDTO.emailAddress,
                );
                return {
                    emailAddress: decryptedEmail,
                    sub: emailDTO.sub,
                };
            }),
        );

        return data;
    }

    getNumberOfBatchesOfNotifications(subscriptionCount: number) {
        const batches = Math.ceil(
            subscriptionCount / (this.SUBSCRIPTIONS_PER_BATCH ?? 50),
        );
        return batches;
    }

    getBatchFromObjectArray(
        inputArray: Subscription[] | Newsletter[] | SavedSearchNotification[],
        batch: number,
        totalBatches: number,
    ) {
        const start = batch * this.SUBSCRIPTIONS_PER_BATCH;
        const end = start + this.SUBSCRIPTIONS_PER_BATCH;
        if (batch === totalBatches - 1) {
            return inputArray.slice(start);
        }
        return inputArray.slice(start, end);
    }

    async buildUnsubscribeUrl({
        subscriptionId,
        newsletterId,
        savedSearchId,
        user,
    }: V2BuildNotificationProps) {
        const existingUnsubscribe =
            await this.unsubscribeService.findOneBySubscriptionIdTypeAndUser(
                subscriptionId,
                newsletterId,
                savedSearchId,
                user,
            );
        if (existingUnsubscribe) {
            return new URL(
                `${this.FRONT_END_HOST}/unsubscribe/${existingUnsubscribe.id}`,
            );
        }
        const unsubscribeReference = await this.unsubscribeService.create({
            user,
            subscriptionId,
            newsletterId,
            savedSearchId,
        });
        return new URL(
            `${this.FRONT_END_HOST}/unsubscribe/${unsubscribeReference.id}`,
        );
    }
}

export type EmailDTO = {
    emailAddress: Buffer;
    sub: string;
};

export type NotificationWithAttachedUser = {
    contentfulGrantSubscriptionId?: string;
    user: User;
};

export const extractEmailFromBatchResponse = (
    emailMap: EmailDTO[],
    { user: { sub: userSub } }: NotificationWithAttachedUser,
) => {
    if (userSub) {
        const { emailAddress } = emailMap.find(({ sub }) => sub === userSub);

        if (emailAddress) {
            return emailAddress.toString();
        }
    }
};

export function addSearchTerm(searchTerm: string) {
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

export function addTextFilter(filter: Filter) {
    return {
        match_phrase: {
            [filter.name]: filter.searchTerm,
        },
    };
}

export function addRangeFilter(filter: Filter) {
    return {
        range: {
            [filter.name]: filter.searchTerm,
        },
    };
}

export function buildIndividualElasticFilters(selectedFilters: Filter[]) {
    const elasticFilters: (
        | { match_phrase: { [x: string]: string | object } }
        | { range: { [x: string]: string | object } }
    )[] = [];

    selectedFilters.forEach((filter: Filter) => {
        switch (filter.type) {
            case 'text-filter': {
                const textMatches = addTextFilter(filter);
                elasticFilters.push(textMatches);
                break;
            }
            case 'range-filter': {
                const rangeMatches = addRangeFilter(filter);
                elasticFilters.push(rangeMatches);
                break;
            }
        }
    });

    return elasticFilters;
}

export function buildSearchFilterArray(
    savedSearch: SavedSearch,
    dateToFilterOn: Date,
) {
    const filterArray = [];

    if (savedSearch.filters !== null) {
        const individualFilters = buildIndividualElasticFilters(
            savedSearch.filters,
        );

        // hard code the search to only return matches for the specified timeframe
        const dateRangeFilter = addRangeFilter({
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

export const getCronJob = (fn: () => Promise<void>, timer: string) => {
    return new CronJob(timer, fn);
};

interface NotificationKeys {
    newsletterId?: string;
    subscriptionId?: string;
    savedSearchId?: number;
}

const NOTIFICATION_KEY_MAP = {
    subscriptionId: GRANT_SUBSCRIPTION,
    newsletterId: NEWSLETTER,
    savedSearchId: SAVED_SEARCH,
} as const;

export const getTypeFromNotificationIds = ({
    subscriptionId,
    newsletterId,
    savedSearchId,
}: NotificationKeys) =>
    Object.values(NOTIFICATION_KEY_MAP).find(
        (value) =>
            (subscriptionId && value === GRANT_SUBSCRIPTION) ||
            (newsletterId && value === NEWSLETTER) ||
            (savedSearchId && value === SAVED_SEARCH),
    ) as typeof NOTIFICATION_KEY_MAP[keyof typeof NOTIFICATION_KEY_MAP];
