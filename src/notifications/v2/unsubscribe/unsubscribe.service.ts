import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NewsletterType, Unsubscribe } from './unsubscribe.entity';
import { UserService } from '../../../user/user.service';
import { User } from '../../../user/user.entity';

@Injectable()
export class UnsubscribeService {
    constructor(
        @InjectRepository(Unsubscribe)
        private unsubscribeRepository: Repository<Unsubscribe>,
        private userService: UserService,
    ) {}

    async findOneById(id: string) {
        return this.unsubscribeRepository.findOne({
            where: { id },
        });
    }

    async deleteOneById(id: string) {
        return this.unsubscribeRepository.delete({ id });
    }

    async deleteOneBySubOrEmail(
        id: string,
        {
            subscriptionId,
            newsletterId,
            savedSearchId,
        }: {
            subscriptionId?: string;
            newsletterId?: NewsletterType;
            savedSearchId?: number;
        },
    ) {
        let user = await this.userService.findBySub(id);
        if (!user) {
            user = await this.userService.findByEmail(id);
        }
        if (!!user) {
            return await this.unsubscribeRepository.delete({
                user,
                newsletterId: newsletterId ?? null,
                savedSearchId: savedSearchId ?? null,
                subscriptionId: subscriptionId ?? null,
            });
        }
    }

    async findOneBySubscriptionIdTypeAndUser(
        subscriptionId: string = null,
        newsletterId: NewsletterType = null,
        savedSearchId: number = null,
        user: User,
    ) {
        return this.unsubscribeRepository.findOne({
            where: {
                subscriptionId,
                newsletterId,
                savedSearchId,
                user,
            },
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
        // Should throw an error if the user already has an unsubscribe record
        // Should throw an error if the user is not defined
        if (!user) {
            throw new Error('User is not defined');
        }
        return this.unsubscribeRepository.save(unsubscribe);
    }
}

type CreateProps = {
    user: User;
    subscriptionId: string;
    newsletterId: NewsletterType;
    savedSearchId: number;
};
