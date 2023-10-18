import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NewsletterType, Unsubscribe } from './unsubscribe.entity';
import { User } from 'src/user/user.entity';

@Injectable()
export class UnsubscribeService {
    constructor(
        @InjectRepository(Unsubscribe)
        private unsubscribeRepository: Repository<Unsubscribe>,
    ) {}

    async findOneById(id: string) {
        return this.unsubscribeRepository.findOne({
            where: { id },
        });
    }

    async create({
        user,
        subscriptionId,
        newsletterId,
        savedSearchId,
        type,
    }: CreateProps) {
        const unsubscribe = new Unsubscribe();
        unsubscribe.subscriptionId = subscriptionId;
        unsubscribe.newsletterId = newsletterId;
        unsubscribe.savedSearchId = savedSearchId;
        unsubscribe.user = user;
        unsubscribe.type = type;

        return this.unsubscribeRepository.save<Unsubscribe>(unsubscribe);
    }
}

type CreateProps = {
    user: User;
    subscriptionId: string;
    newsletterId: NewsletterType;
    savedSearchId: number;
    type: 'GRANT_SUBSCRIPTION' | 'NEWSLETTER' | 'SAVED_SEARCH';
};
