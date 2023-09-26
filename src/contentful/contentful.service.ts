import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
    createClient as CreateContentfulClient,
    ContentfulClientApi,
} from 'contentful';
import {
    createClient as CreateContentfulManagementClient,
    KeyValueMap,
    PlainClientAPI,
} from 'contentful-management';
@Injectable()
export class ContentfulService {
    private contentfulClient: ContentfulClientApi<undefined>;
    private contentfulManagementClient: PlainClientAPI;

    constructor(private config: ConfigService) {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        this.contentfulClient = CreateContentfulClient({
            space: config.get('CONTENTFUL_SPACE_ID'),
            accessToken: config.get('CONTENTFUL_ACCESS_TOKEN'),
            environment: config.get('CONTENTFUL_ENVIRONMENT'),
        });

        this.contentfulManagementClient = CreateContentfulManagementClient(
            {
                accessToken: config.get('CONTENTFUL_MANAGEMENT_TOKEN'),
            },
            {
                type: 'plain',
                defaults: {
                    spaceId: config.get('CONTENTFUL_SPACE_ID'),
                    environmentId: config.get('CONTENTFUL_ENVIRONMENT'),
                },
            },
        );
    }

    async fetchEntries(contentIds: string[]) {
        const query: KeyValueMap = {
            content_type: 'grantDetails',
            select: 'fields.grantName,fields.label,fields.grantFunder,fields.grantLocation,fields.grantShortDescription,fields.grantTotalAwardAmount,fields.grantTotalAwardDisplay,fields.grantMinimumAward,fields.grantMinimumAwardDisplay,fields.grantMaximumAward,fields.grantMaximumAwardDisplay,fields.grantApplicationOpenDate,fields.grantApplicationCloseDate',
        };

        if (contentIds) {
            query['sys.id[in]'] = contentIds.join(',');
        }

        const entries = await this.contentfulClient.getEntries(query);

        if (entries.items) return entries.items;
    }

    async updateEntries(contentIds: string[], update: KeyValueMap) {
        console.log('updating entries');
        const entries = await this.contentfulManagementClient.entry.getMany({
            query: {
                'sys.id[in]': contentIds.join(','),
            },
        });

        for (const entry of entries.items) {
            entry.fields = {
                ...entry.fields,
                ...update,
            };
            console.log(entry);

            const updateResponse =
                await this.contentfulManagementClient.entry.update(
                    {
                        entryId: entry.sys.id,
                    },
                    entry,
                );

            console.log('entry updated');
            await this.contentfulManagementClient.entry.publish(
                {
                    entryId: entry.sys.id,
                },
                { sys: updateResponse.sys, fields: {} },
            );
            console.log('entry published');
        }
    }

    async fetchEntry(id: string) {
        const result = await this.contentfulClient.getEntry(id);
        return result;
    }
}
