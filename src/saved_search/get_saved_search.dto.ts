import { User } from '../user/user.entity';
import { Filter, SavedSearchStatusType } from './saved_search.entity';

export class GetSavedSearchDto {
    id: number;
    user: User;
    name: string;
    search_term: string;
    filters: Filter[];
    fromDate: Date;
    toDate: Date;
    status: SavedSearchStatusType;
    notifications: boolean;
}
