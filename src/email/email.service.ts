import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
//@ts-ignore
//notifications-node-client currently has no type definitions
import { NotifyClient } from 'notifications-node-client';

@Injectable()
export class EmailService {
    private notifyClient: NotifyClient;

    constructor(private configService: ConfigService) {
        this.notifyClient = new NotifyClient(
            this.configService.get<string>('GOV_NOTIFY_API_KEY'),
        );
    }

    async send(
        emailAddress: string,
        templateId: string,
        personalisation: Personalisation,
        reference: string,
    ) {
        await this.notifyClient.sendEmail(templateId, emailAddress, {
            personalisation: personalisation,
            reference: reference,
        });
    }
}

type Personalisation = {
    'name of grant'?: string;
    'link to specific grant'?: string;
    'Name of grant'?: string;
    date?: string;
    'Link to new grant summary page'?: URL;
    'name of saved search'?: string;
    'link to saved search match'?: string;
    greeting?: string;
};
