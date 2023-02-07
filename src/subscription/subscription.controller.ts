import {
    Body,
    Controller,
    Delete,
    Get,
    Param,
    Post,
    Res,
} from '@nestjs/common';
import { Response } from 'express';
import { CreateSubscriptionDto } from './subscription.dto';
import { Subscription } from './subscription.entity';
import { SubscriptionService } from './subscription.service';

@Controller('subscriptions')
export class SubscriptionController {
    constructor(private subscriptionService: SubscriptionService) {}
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
    ): Promise<void> {
        const result = await this.subscriptionService.deleteByEmailAndGrantId(
            plainTextEmailAddress,
            grantId,
        );

        result.affected == 0 ? response.status(404) : response.status(204);
        response.send();
    }
}
