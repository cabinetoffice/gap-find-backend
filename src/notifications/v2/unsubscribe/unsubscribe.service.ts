import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NewsletterType, Unsubscribe } from './unsubscribe.entity';
import { UserService } from '../../../user/user.service';

@Injectable()
export class UnsubscribeService {
    constructor(
        @InjectRepository(Unsubscribe)
        private unsubscribeRepository: Repository<Unsubscribe>,
        private userService: UserService,
    ) {}

    async findOneById(id: string) {
        return this.unsubscribeRepository.findOne({ where: { id } });
    }

    async create(
        userId: number,
        subscriptionId: number,
        newsletterId: NewsletterType,
        savedSearchId: number,
    ): Promise<Unsubscribe> {
        const user = await this.userService.findById(userId);

        const unsubscribe = new Unsubscribe();
        unsubscribe.subscriptionId = subscriptionId;
        unsubscribe.newsletterId = newsletterId;
        unsubscribe.savedSearchId = savedSearchId;
        unsubscribe.user = user;

        return await this.unsubscribeRepository.save(unsubscribe);
    }
}
