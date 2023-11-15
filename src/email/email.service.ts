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
        try {
            await this.notifyClient.sendEmail(templateId, emailAddress, {
                personalisation: personalisation,
                reference: reference,
            });
        } catch (error) {
            const statusCode = Number(error.response.status);
            switch (statusCode) {
                case 429:
                    console.info(
                        'Hit rate limiting while sending emails, waiting for one minute then retrying.',
                    );
                    await new Promise((resolve) => setTimeout(resolve, 60000));
                    await this.send(
                        emailAddress,
                        templateId,
                        personalisation,
                        reference,
                    );
                    break;
                default:
                    console.debug(error);
                    throw new Error(
                        `Failed to send email with status code ${statusCode} ${JSON.stringify(
                            {
                                templateId: templateId,
                                personalisation: personalisation,
                                reference: reference,
                            },
                        )}`,
                    );
            }
        }
    }
}

type Personalisation = {
    unsubscribeUrl: URL;
    'name of grant'?: string;
    'link to specific grant'?: string;
    'Name of grant'?: string;
    date?: string;
    'Link to new grant summary page'?: URL;
    'name of saved search'?: string;
    'link to saved search match'?: string;
    greeting?: string;
};
