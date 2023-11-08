import { Filter, SavedSearchStatusType } from './saved_search.entity';

export class CreateSavedSearchDto {
    name: string;
    search_term: string;
    filters: Filter[];
    fromDate: Date;
    toDate: Date;
    status: SavedSearchStatusType;
    notifications: boolean;
    email: string;
    sub?: string;
}
