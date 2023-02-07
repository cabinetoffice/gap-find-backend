import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NotifyClient } from 'notifications-node-client';

@Injectable()
export class EmailService {
    private notifyClient: NotifyClient;

    constructor(private configService: ConfigService) {
        this.notifyClient = new NotifyClient(
            this.configService.get<string>('GOV_NOTIFY_API_KEY'),
        );
    }

    async send(emailAddress, templateId, personalisation, reference) {
        await this.notifyClient.sendEmail(templateId, emailAddress, {
            personalisation: personalisation,
            reference: reference,
        });
    }
}
