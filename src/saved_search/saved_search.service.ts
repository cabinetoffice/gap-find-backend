import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/user/user.entity';
import { Brackets, Repository } from 'typeorm';
import { UserService } from '../user/user.service';
import { CreateSavedSearchDto } from './saved_search.dto';
import { SavedSearch, SavedSearchStatusType } from './saved_search.entity';

@Injectable()
export class SavedSearchService {
    constructor(
        @InjectRepository(SavedSearch)
        private savedSearchRepository: Repository<SavedSearch>,
        private userService: UserService,
    ) {}

    async getAllByUser(plainTextEmailAddress: string) {
        const user = await this.userService.findByEmail(plainTextEmailAddress);
        if (!user) {
            return <SavedSearch[]>[];
        }
        const savedSearches = await this.savedSearchRepository.find();
        return savedSearches.filter(
            (savedSearch) => savedSearch.user.id === user.id,
        );
    }

    async create(savedSearch: CreateSavedSearchDto) {
        const { email, sub } = savedSearch;

        let user = sub
            ? await this.userService.findBySub(sub)
            : await this.userService.findByEmail(email);

        if (!user) {
            user = await this.userService.create(email, sub);
        }

        const savedSearchEntity = this.dtoToEntity(savedSearch, user);
        return this.savedSearchRepository.save(savedSearchEntity);
    }

    async findById(id: number) {
        return this.savedSearchRepository.findOne({ where: { id } });
    }

    async findAllByStatus(status: SavedSearchStatusType) {
        return this.savedSearchRepository.find({
            where: {
                status,
            },
        });
    }

    async findAllConfirmedSearchesWhereDateRangeIsNullOrOverlaps(date: Date) {
        const query = this.savedSearchRepository
            .createQueryBuilder('savedSearch')
            .innerJoinAndSelect('savedSearch.user', 'user')
            .where('savedSearch.status = :status', { status: 'CONFIRMED' })
            .andWhere('savedSearch.notifications = :notifications', {
                notifications: true,
            })
            .andWhere(
                new Brackets((qb) => {
                    qb.where(
                        new Brackets((qb) => {
                            qb.where(
                                'savedSearch.from_date <= :date AND savedSearch.to_date >= :date',
                                { date },
                            );
                        }),
                    );

                    qb.orWhere(
                        new Brackets((qb) => {
                            qb.where(
                                'savedSearch.from_date is null AND savedSearch.to_date is null',
                            );
                        }),
                    );
                }),
            );
        return query.getMany();
    }

    async updateStatus(
        savedSearch: SavedSearch,
        status: SavedSearchStatusType,
    ) {
        savedSearch.status = status;
        return this.savedSearchRepository.save(savedSearch);
    }

    async delete(id: number, user: User) {
        const savedSearch: SavedSearch = await this.findById(id);
        if (savedSearch.user.id === user.id) {
            return await this.savedSearchRepository.delete({ id });
        } else {
            throw new HttpException(
                'Email does not match',
                HttpStatus.FORBIDDEN,
            );
        }
    }

    private dtoToEntity(savedSearch: CreateSavedSearchDto, user: User) {
        const savedSearchEntity = new SavedSearch();
        savedSearchEntity.name = savedSearch.name;
        savedSearchEntity.search_term = savedSearch.search_term;
        savedSearchEntity.filters = savedSearch.filters;
        savedSearchEntity.fromDate = savedSearch.fromDate;
        savedSearchEntity.toDate = savedSearch.toDate;
        savedSearchEntity.status = savedSearch.status;
        savedSearchEntity.notifications = savedSearch.notifications;
        savedSearchEntity.user = user;
        return savedSearchEntity;
    }
}
