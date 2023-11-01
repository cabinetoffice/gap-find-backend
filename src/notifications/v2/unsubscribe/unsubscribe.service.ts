import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NewsletterType, Unsubscribe } from './unsubscribe.entity';
import { User } from 'src/user/user.entity';
import {UserService} from "../../../user/user.service";

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

    async deleteOneBySub(
      sub: string,
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
        const user = await this.userService.findBySub(sub);
        return this.unsubscribeRepository.delete({
            user,
            newsletterId,
            savedSearchId,
            subscriptionId,
        });
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
