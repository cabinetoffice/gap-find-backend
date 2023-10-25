import {
    Controller,
    Get,
    Post,
    Delete,
    Param,
    Body,
    Res,
} from '@nestjs/common';
import { NewsletterService } from './newsletter.service';
import { Response } from 'express';
import { NewsletterType } from './newsletter.entity';

@Controller('newsletters')
export class NewsletterController {
    constructor(private newsletterService: NewsletterService) {}

    @Get()
    async findAll() {
        return this.newsletterService.findAll();
    }

    @Get(':newsletterId')
    async findOne(@Param('newsletterId') id: number) {
        return this.newsletterService.findOneById(id);
    }

    @Get('/users/:plainTextEmailAddress/types/:newsletterType')
    async findOneByEmailAndType(
        @Param('plainTextEmailAddress') plainTextEmailAddress: string,
        @Param('newsletterType') type: NewsletterType,
    ) {
        return this.newsletterService.findOneByEmailAddressAndType(
            plainTextEmailAddress,
            type,
        );
    }

    @Post()
    async create(
        @Body('email') plainTextEmailAddress: string,
        @Body('sub') sub: string,
        @Body('newsletterType') type: NewsletterType,
    ) {
        return this.newsletterService.create(plainTextEmailAddress, sub, type);
    }

    @Delete(':newsletterId')
    async delete(@Param('newsletterId') id: number, @Res() response: Response) {
        const result = await this.newsletterService.deleteByNewsletterId(id);
        result == 0 ? response.status(404) : response.status(204);

        response.send();
    }

    @Delete('/users/:plainTextEmailAddress/types/:newsletterType')
    async deleteByUserAndType(
        @Param('plainTextEmailAddress') plainTextEmailAddress: string,
        @Param('newsletterType') type: NewsletterType,
        @Res() response: Response,
    ) {
        const result = await this.newsletterService.deleteByEmailAddressAndType(
            plainTextEmailAddress,
            type,
        );
        result == 0 ? response.status(404) : response.status(204);

        response.send();
    }
}
