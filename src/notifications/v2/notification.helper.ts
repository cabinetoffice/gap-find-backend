import { Filter, SavedSearch } from 'src/saved_search/saved_search.entity';
import {
    BuildNotificationProps,
    V2BuildNotificationProps,
} from '../notifications.types';
import { ELASTIC_INDEX_FIELDS } from 'src/grant/grant.constants';
import { sign } from 'jsonwebtoken';
import axios from 'axios';
import { User } from 'src/user/user.entity';
import { ConfigService } from '@nestjs/config';
import { Injectable } from '@nestjs/common';
import { UserService } from 'src/user/user.service';
import { UnsubscribeService } from './unsubscribe/unsubscribe.service';

@Injectable()
export class NotificationsHelper {
    private FRONT_END_HOST: string;
    private USER_SERVICE_URL: string;
    private SUBSCRIPTIONS_PER_BATCH: number;
    private JWT_SECRET_KEY: string;
    private NOTIFICATION_UNSUBSCRIBE_JWT_EXPIRY_TIME: string;

    constructor(
        private configService: ConfigService,
        private unsubscribeService: UnsubscribeService,
    ) {
        this.FRONT_END_HOST = this.configService.get<string>('FRONT_END_HOST');
        this.USER_SERVICE_URL =
            this.configService.get<string>('USER_SERVICE_URL');
        this.SUBSCRIPTIONS_PER_BATCH = this.configService.get<number>(
            'SUBSCRIPTIONS_PER_BATCH',
        );
        this.JWT_SECRET_KEY = this.configService.get<string>('JWT_SECRET_KEY');
        this.NOTIFICATION_UNSUBSCRIBE_JWT_EXPIRY_TIME =
            this.configService.get<string>(
                'NOTIFICATION_UNSUBSCRIBE_JWT_EXPIRY_TIME',
            );
    }

    async getUserServiceEmailsBySubBatch(batchOfSubs: string[]) {
        const response = await axios.post(
            this.USER_SERVICE_URL + '/users/emails',
            batchOfSubs,
            {
                headers: {
                    'Content-Type': 'application/json',
                },
            },
        );

        console.log({ response });
        return response.data;
    }

    bacthJobCalc(subscriptionCount: number) {
        const batches = Math.ceil(
            subscriptionCount / this.SUBSCRIPTIONS_PER_BATCH,
        );
        return batches;
    }

    getBatchFromObjectArray(
        inputArray: any[],
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
        type,
    }: V2BuildNotificationProps) {
        const unsubscribeReference = await this.unsubscribeService.create({
            user,
            subscriptionId,
            newsletterId,
            savedSearchId,
            type,
        });
        return new URL(
            `${this.FRONT_END_HOST}/unsubscribe/${unsubscribeReference.id}`,
        );
    }
}

type EmailDTO = {
    emailAddress: string;
    sub: string;
};

type NotificationWithAttachedUser = {
    user: User;
};

export const extractEmailFromBatchResponse = (
    emailMap: EmailDTO[],
    notification: NotificationWithAttachedUser,
) => {
    if (notification.user.sub) {
        const { emailAddress } = emailMap.find(({ sub }) => {
            return sub === notification.user.sub;
        });
        if (emailAddress) {
            return emailAddress;
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

export function buildSearchFilterArray(
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
