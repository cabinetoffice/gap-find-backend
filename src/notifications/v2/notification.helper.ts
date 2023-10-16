import { Filter, SavedSearch } from 'src/saved_search/saved_search.entity';
import { BuildNotificationProps } from '../notifications.types';
import { ELASTIC_INDEX_FIELDS } from 'src/grant/grant.constants';
import { sign } from 'jsonwebtoken';
import axios from 'axios';
import { User } from 'src/user/user.entity';

const USER_SERVICE_URL = process.env.USER_SERVICE_URL;

type EmailDTO = {
    email: string;
    sub: string;
};

type NotificationWithAttachedUser = {
    user: User;
};

export const getUserServiceEmailsBySubBatch = async (
    batchOfSubs: string[],
    URL: string,
) => {
    console.log('Getting emails from user service');
    console.log(batchOfSubs);
    const response = await axios.post(URL + '/users/emails', batchOfSubs, {
        headers: {
            'Content-Type': 'application/json',
        },
    });
    return response.data;
};

export const bacthJobCalc = (subscriptionCount: number) => {
    const batches = Math.ceil(
        subscriptionCount / parseInt(process.env.SUBSCRIPTIONS_PER_BATCH),
    );
    return batches;
};

export const extractEmailFromBatchResponse = (
    emailMap: EmailDTO[],
    notification: NotificationWithAttachedUser,
) => {
    if (notification.user.sub) {
        const { email } = emailMap.find(
            ({ sub }) => sub === notification.user.sub,
        );
        if (email) {
            return email;
        }
    }
};

export const getBatchFromObjectArray = (
    inputArray: any[],
    batch: number,
    totalBatches: number,
) => {
    const start = batch * parseInt(process.env.SUBSCRIPTIONS_PER_BATCH);
    const end = start + parseInt(process.env.SUBSCRIPTIONS_PER_BATCH);
    if (batch === totalBatches - 1) {
        return inputArray.slice(start);
    }
    return inputArray.slice(start, end);
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

export function buildUnsubscribeUrl({
    id,
    emailAddress,
    type,
}: BuildNotificationProps) {
    const token = sign({ id, emailAddress, type }, process.env.JWT_SECRET_KEY, {
        expiresIn: process.env.NOTIFICATION_UNSUBSCRIBE_JWT_EXPIRY_TIME ?? '7d',
    });
    return new URL(`${this.FRONT_END_HOST}/unsubscribe/${token}`);
}
