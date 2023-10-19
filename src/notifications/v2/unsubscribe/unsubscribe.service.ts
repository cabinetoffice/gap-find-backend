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

    async deleteOneById(id: string) {
        return this.unsubscribeRepository.delete({ id });
    }

    async findOneBySubscriptionIdTypeAndUser(
        subscriptionId: string,
        type: 'GRANT_SUBSCRIPTION' | 'NEWSLETTER' | 'SAVED_SEARCH',
        user: User,
    ) {
        return this.unsubscribeRepository.findOne({
            where: { subscriptionId, type, user },
        });
    }

    async create({
        user,
        subscriptionId,
        newsletterId,
        savedSearchId,
    }: CreateProps) {
        const unsubscribe = new Unsubscribe();
        unsubscribe.subscriptionId = subscriptionId;
        unsubscribe.newsletterId = newsletterId;
        unsubscribe.savedSearchId = savedSearchId;
        unsubscribe.user = user;

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
