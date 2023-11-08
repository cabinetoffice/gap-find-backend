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

    @Get('users/:id/grants/:grantId')
    async findByUserAndGrantId(
        @Param('id') id: string,
        @Param('grantId') grantId: string,
    ): Promise<Subscription> {
        const subscription = await this.subscriptionService.findBySubAndGrantId(
            id,
            grantId,
        );

        return subscription
            ? subscription
            : this.subscriptionService.findByEmailAndGrantId(id, grantId);
    }

    @Delete('users/:id/grants/:grantId')
    async deleteByUserAndGrantId(
        @Param('id') id: string,
        @Param('grantId') grantId: string,
        @Res() response: Response,
        @Query() query: { unsubscribeReference?: string },
    ): Promise<void> {
        const ref = query?.unsubscribeReference;
        let result = await this.subscriptionService.deleteBySubAndGrantId(
            id,
            grantId,
        );
        if (result.affected == 0) {
            result = await this.subscriptionService.deleteByEmailAndGrantId(
                id,
                grantId,
            );
        }

        if (ref && ref !== 'undefined') {
            await this.unsubscribeService
                .deleteOneById(ref)
                .catch((error: unknown) => {
                    console.error(
                        `Failed to unsubscribe from unsubscribeReference: ${ref}.
                        error:${JSON.stringify(error)}`,
                    );
                });
        } else {
            await this.unsubscribeService
                .deleteOneBySubOrEmail(id, { subscriptionId: grantId })
                .catch((error: unknown) => {
                    console.error(
                        `Failed to unsubscribe from sub: ${id}. error:${JSON.stringify(
                            error,
                        )}`,
                    );
                });
        }

        response.status(result.affected == 0 ? 404 : 204);
        response.end();
    }
}
