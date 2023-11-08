import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DeleteResult, Repository } from 'typeorm';
import { UserService } from '../user/user.service';
import { CreateSubscriptionDto } from './subscription.dto';
import { Subscription } from './subscription.entity';

@Injectable()
export class SubscriptionService {
    constructor(
        @InjectRepository(Subscription)
        private subscriptionRepository: Repository<Subscription>,
        private userService: UserService,
    ) {}

    async create(dto: CreateSubscriptionDto) {
        let user;
        if (dto.sub) {
            user = await this.userService.findBySub(dto.sub);
        } else {
            user = await this.userService.findByEmail(dto.emailAddress);
        }

        if (user) {
            const foundSubscription = await this.subscriptionRepository.findOne(
                {
                    where: {
                        contentfulGrantSubscriptionId:
                            dto.contentfulGrantSubscriptionId,
                        user,
                    },
                },
            );

            if (foundSubscription) {
                return foundSubscription;
            }
        } else {
            user = await this.userService.create(dto.emailAddress, dto.sub);
        }

        const subscription = new Subscription();
        subscription.contentfulGrantSubscriptionId =
            dto.contentfulGrantSubscriptionId;
        subscription.user = user;

        const result = await this.subscriptionRepository.save(subscription);
        return result;
    }

    async findAll(): Promise<Subscription[]> {
        const subscripionsResult = await this.subscriptionRepository.find();
        return subscripionsResult;
    }

    async findAllByContentGrantSubscriptionId(
        grantId: string,
    ): Promise<Subscription[]> {
        const subscripionsResult = await this.subscriptionRepository.find({
            where: { contentfulGrantSubscriptionId: grantId },
            relations: ['user'],
        });
        return subscripionsResult;
    }

    async findAllBySubOrEmailAddress(id: string): Promise<Subscription[]> {
        let user = await this.userService.findBySub(id);
        if (!user) user = await this.userService.findByEmail(id);
        if (!user) {
            return <Subscription[]>[];
        }
        const subscripionsResult = await this.subscriptionRepository.find({
            where: {
                user,
            },
        });
        return subscripionsResult;
    }

    async findByEmailAndGrantId(
        emailAddress: string,
        contentfulGrantSubscriptionId: string,
    ): Promise<Subscription> {
        const user = await this.userService.findByEmail(emailAddress);
        if (!user) {
            return undefined;
        }
        const subscripionsResult = await this.subscriptionRepository.findOne({
            where: {
                contentfulGrantSubscriptionId,
                user,
            },
        });
        return subscripionsResult;
    }

    async findBySubAndGrantId(
        sub: string,
        contentfulGrantSubscriptionId: string,
    ): Promise<Subscription> {
        const user = await this.userService.findBySub(sub);
        if (!user) {
            return undefined;
        }
        const subscripionsResult = await this.subscriptionRepository.findOne({
            where: {
                contentfulGrantSubscriptionId,
                user,
            },
        });
        return subscripionsResult;
    }

    async deleteByEmailAndGrantId(
        emailAddress: string,
        contentfulGrantSubscriptionId: string,
    ) {
        const user = await this.userService.findByEmail(emailAddress);
        if (!user) {
            return {
                raw: null,
                affected: 0,
            };
        }
        const deleteResult = await this.subscriptionRepository.delete({
            contentfulGrantSubscriptionId,
            user,
        });

        return deleteResult;
    }

    async deleteBySubAndGrantId(
        sub: string,
        contentfulGrantSubscriptionId: string,
    ): Promise<DeleteResult> {
        const user = await this.userService.findBySub(sub);
        if (!user) {
            return {
                raw: null,
                affected: 0,
            };
        }
        const deleteResult = await this.subscriptionRepository.delete({
            contentfulGrantSubscriptionId,
            user,
        });

        return deleteResult;
    }
}
