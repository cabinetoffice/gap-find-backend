import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Filter, SavedSearch } from 'src/saved_search/saved_search.entity';
import { Repository } from 'typeorm';
import { SavedSearchNotification } from './saved_search_notification.entity';

@Injectable()
export class SavedSearchNotificationService {
    private FRONT_END_HOST: string;
    constructor(
        @InjectRepository(SavedSearchNotification)
        private savedSearchNotificationRepository: Repository<SavedSearchNotification>,
        private configService: ConfigService,
    ) {
        this.FRONT_END_HOST = this.configService.get<string>('FRONT_END_HOST');
    }

    async createSavedSearchNotification(savedSearch: SavedSearch) {
        const notification = new SavedSearchNotification();
        notification.user = savedSearch.user;
        notification.savedSearch = savedSearch;
        notification.resultsUri = this.buildResultsUri(savedSearch);

        this.savedSearchNotificationRepository.save(notification);
    }

    async getAllSavedSearchNotifications(): Promise<SavedSearchNotification[]> {
        return this.savedSearchNotificationRepository.find({});
    }

    async updateSavedSearchNotification(
        notification: SavedSearchNotification,
    ): Promise<SavedSearchNotification> {
        return this.savedSearchNotificationRepository.save(notification);
    }

    async deleteSentSavedSearchNotifications() {
        this.savedSearchNotificationRepository.delete({ emailSent: true });
    }

    private convertDateToQueryParams(date: Date, paramName: string) {
        const year = date.getFullYear();
        const month = date.getMonth() + 1;
        const day = date.getDate();

        return `${paramName}-day=${day}&${paramName}-month=${month}&${paramName}-year=${year}`;
    }

    private buildResultsUri(savedSearch: SavedSearch) {
        // convert the array of filters into query strings
        let queryString = '';
        queryString += savedSearch.filters
            .flatMap((filter: Filter) => {
                return `${filter.name}=${filter.subFilterid}`;
            })
            .join('&');

        // convert dates into query strings
        if (savedSearch.fromDate && savedSearch.toDate) {
            // from date
            const fromDateParams = this.convertDateToQueryParams(
                savedSearch.fromDate,
                'from',
            );

            // to date
            const toDateParams = this.convertDateToQueryParams(
                savedSearch.toDate,
                'to',
            );

            queryString += `${
                queryString.length > 0 ? '&' : ''
            }${fromDateParams}&${toDateParams}`;
        }

        // convert search keywords into query strings
        if (savedSearch.search_term) {
            queryString += `${queryString.length > 0 ? '&' : ''}searchTerm=${
                savedSearch.search_term
            }`;
        }

        return `${this.FRONT_END_HOST}/grants?${queryString}`;
    }
}
