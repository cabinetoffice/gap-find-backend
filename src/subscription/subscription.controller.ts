import { UnsubscribeService } from './../notifications/v2/unsubscribe/unsubscribe.service';
import {
    Body,
    Controller,
    Delete,
    Get,
    Param,
    Post,
    Query,
    Res,
} from '@nestjs/common';
import { Response } from 'express';
import { CreateSubscriptionDto } from './subscription.dto';
import { Subscription } from './subscription.entity';
import { SubscriptionService } from './subscription.service';

@Controller('subscriptions')
export class SubscriptionController {
    constructor(
        private subscriptionService: SubscriptionService,
        private unsubscribeService: UnsubscribeService,
    ) {}
    @Post()
    async create(@Body() dto: CreateSubscriptionDto): Promise<Subscription> {
        const result = await this.subscriptionService.create(dto);
        delete result.user;
        return result;
    }

    @Get('users/:plainTextEmailAddress')
    async findAllByEmailAddress(
        @Param('plainTextEmailAddress') plainTextEmailAddress: string,
    ): Promise<Subscription[]> {
        return this.subscriptionService.findAllByEmailAddress(
            plainTextEmailAddress,
        );
    }

    @Get('users/:plainTextEmailAddress/grants/:grantId')
    async findByEmailAddressAndGrantId(
        @Param('plainTextEmailAddress') plainTextEmailAddress: string,
        @Param('grantId') grantId: string,
    ): Promise<Subscription> {
        return this.subscriptionService.findByEmailAndGrantId(
            plainTextEmailAddress,
            grantId,
        );
    }

    @Delete('users/:plainTextEmailAddress/grants/:grantId')
    async deleteByEmailAndGrantId(
        @Param('plainTextEmailAddress') plainTextEmailAddress: string,
        @Param('grantId') grantId: string,
        @Res() response: Response,
        @Query() query: { unsubscribeReference?: string },
    ): Promise<void> {
        const result = await this.subscriptionService.deleteByEmailAndGrantId(
            plainTextEmailAddress,
            grantId,
        );
        if (query?.unsubscribeReference) {
            await this.unsubscribeService
                .deleteOneById(query.unsubscribeReference)
                .catch((error: unknown) => {
                    console.error(
                        `Failed to unsubscribe from unsubscribeReference:
                            ${
                                query.unsubscribeReference
                            }. error:${JSON.stringify(error)}`,
                    );
                });
        }

        result.affected == 0 ? response.status(404) : response.status(204);
        response.send();
    }
}
