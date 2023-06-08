import { ApiResponse } from '@elastic/elasticsearch';

export interface ContentfulGrant {
    fields: {
        grantName: string;
        label: string;
        grantApplicationOpenDate: Date;
        grantApplicationCloseDate: Date;
    };
    sys: {
        id: string;
    };
    closing: boolean;
}

export type ElasticSearchResponse = ApiResponse<
    Record<string, any>,
    Record<string, unknown>
>;
