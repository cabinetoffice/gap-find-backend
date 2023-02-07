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
