import {
    Controller,
    Get,
    Post,
    Delete,
    Param,
    Body,
    Res,
    Query,
} from '@nestjs/common';
import { NewsletterService } from './newsletter.service';
import { Response } from 'express';
import { NewsletterType } from './newsletter.entity';
import { UnsubscribeService } from '../notifications/v2/unsubscribe/unsubscribe.service';

@Controller('newsletters')
export class NewsletterController {
    constructor(
        private newsletterService: NewsletterService,
        private unsubscribeService: UnsubscribeService,
    ) {}

    @Get()
    async findAll() {
        return this.newsletterService.findAll();
    }

    @Get(':newsletterId')
    async findOne(@Param('newsletterId') id: number) {
        return this.newsletterService.findOneById(id);
    }

    @Get('/users/:id/types/:newsletterType')
    async findOneByUserAndType(
        @Param('id') id: string,
        @Param('newsletterType') type: NewsletterType,
    ) {
        return this.newsletterService.findOneBySubOrEmailAddressAndType(
            id,
            type,
        );
    }

    @Post()
    async create(
        @Body('email') plainTextEmailAddress: string,
        @Body('sub') sub: string,
        @Body('newsletterType') type: NewsletterType,
    ) {
        return this.newsletterService.create(plainTextEmailAddress, type, sub);
    }

    @Delete(':newsletterId')
    async delete(@Param('newsletterId') id: number, @Res() response: Response) {
        const result = await this.newsletterService.deleteByNewsletterId(id);
        result == 0 ? response.status(404) : response.status(204);

        response.send();
    }

    @Delete('/users/:id/types/:newsletterType')
    async deleteByUserAndType(
        @Param('id') id: string,
        @Param('newsletterType') type: NewsletterType,
        @Res() response: Response,
        @Query() query: { unsubscribeReference?: string },
    ) {
        let result = await this.newsletterService.deleteBySubAndType(id, type);
        if (result.affected === 0) {
            result = await this.newsletterService.deleteByEmailAddressAndType(
                id,
                type,
            );
        }
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

        result.affected === 0 ? response.status(404) : response.status(204);

        response.send();
    }
}
