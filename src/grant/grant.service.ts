import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ElasticsearchService } from '@nestjs/elasticsearch';
import { DateTime } from 'luxon';
import { ContentfulService } from '../contentful/contentful.service';
import { ELASTIC_INDEX_FIELDS } from './grant.constants';
import { ContentfulGrant } from './grant.interfaces';
@Injectable()
export class GrantService {
    constructor(
        private config: ConfigService,
        private elasticsearchService: ElasticsearchService,
        private contentfulService: ContentfulService,
    ) {}

    async findAllUpdatedGrants() {
        const result = await this.elasticsearchService.search({
            index: this.config.get('ELASTIC_INDEX'),
            body: {
                query: {
                    match: {
                        'fields.grantUpdated.en-US': true,
                    },
                },
            },
        });

        const ids = result?.body?.hits?.hits?.map(({ _id }) => _id);
        return ids;
    }

    async findAllUpcomingOpeningGrants(): Promise<ContentfulGrant[]> {
        const startOfDayInTwoWeeksTime = this.getStartOfDayInXDays(14);
        const endOfDayInTwoWeeksTime = this.getEndOfDayInXDays(14);

        const result = await this.elasticsearchService.search({
            index: this.config.get('ELASTIC_INDEX'),
            body: {
                query: {
                    range: {
                        'fields.grantApplicationOpenDate.en-US': {
                            gte: startOfDayInTwoWeeksTime,
                            lte: endOfDayInTwoWeeksTime,
                        },
                    },
                },
            },
        });

        return this.returnUpcomingGrantArray(result, false);
    }

    async findAllUpcomingClosingGrants(): Promise<ContentfulGrant[]> {
        const startOfDayInTwoWeeksTime = this.getStartOfDayInXDays(14);
        const endOfDayInTwoWeeksTime = this.getEndOfDayInXDays(14);

        const result = await this.elasticsearchService.search({
            index: this.config.get('ELASTIC_INDEX'),
            body: {
                query: {
                    range: {
                        'fields.grantApplicationCloseDate.en-US': {
                            gte: startOfDayInTwoWeeksTime,
                            lte: endOfDayInTwoWeeksTime,
                        },
                    },
                },
            },
        });

        return this.returnUpcomingGrantArray(result, true);
    }

    async findGrantsPublishedAfterDate(date: Date) {
        const result = await this.elasticsearchService.search({
            index: this.config.get('ELASTIC_INDEX'),
            body: {
                query: {
                    range: {
                        'sys.createdAt': {
                            gte: date.toISOString(),
                        },
                    },
                },
            },
        });

        const ids = result?.body.hits?.hits?.map(({ _id }) => _id);
        return ids;
    }

    async findGrantsMatchingFilterCriteria(
        filterArray: object[],
    ): Promise<string[]> {
        const query = {
            index: this.config.get('ELASTIC_INDEX'),
            body: {
                query: {
                    bool: {
                        must: [
                            { match: { [ELASTIC_INDEX_FIELDS.type]: 'Entry' } },
                            {
                                match: {
                                    [ELASTIC_INDEX_FIELDS.contentType]:
                                        'grantDetails',
                                },
                            },
                        ],
                        must_not: [
                            {
                                match: {
                                    [ELASTIC_INDEX_FIELDS.publishedCounter]: 0,
                                },
                            },
                        ],
                        filter: filterArray,
                    },
                },
            },
        };

        const result = await this.elasticsearchService.search(query);

        const ids = result?.body?.hits?.hits?.map(({ _id }) => _id);
        return ids;
    }

    private async returnUpcomingGrantArray(result, isClosing: boolean) {
        if (result.body.hits.total.value === 0) {
            return Promise.resolve([]);
        }
        const grantIDs = result.body.hits.hits.map(({ _id }) => _id);
        const grants = await this.contentfulService.fetchEntries(grantIDs);
        const mygrants = grants.map((grant) => {
            return { ...grant, closing: isClosing };
        });
        return mygrants;
    }

    private getStartOfDayInXDays(days: number): string {
        return DateTime.utc().plus({ days }).startOf('day').toISO();
    }

    private getEndOfDayInXDays(days: number): string {
        return DateTime.utc().plus({ days }).endOf('day').toISO();
    }
}
