import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DateTime } from 'luxon';
import { NewsletterType } from '../newsletter/newsletter.entity';
import { NewsletterService } from '../newsletter/newsletter.service';
import { ContentfulService } from '../contentful/contentful.service';
import { EmailService } from '../email/email.service';
import { GrantService } from '../grant/grant.service';
import { SubscriptionService } from '../subscription/subscription.service';

@Injectable()
export class NotificationsService {
    private GRANT_UPDATED_TEMPLATE_ID: string;
    private GRANT_CLOSING_TEMPLATE_ID: string;
    private GRANT_OPENING_TEMPLATE_ID: string;
    private NEW_GRANTS_EMAIL_TEMPLATE_ID: string;
    private HOST: string;

    constructor(
        private grantService: GrantService,
        private subscriptionService: SubscriptionService,
        private emailService: EmailService,
        private configService: ConfigService,
        private contentfulService: ContentfulService,
        private newsletterService: NewsletterService,
    ) {
        this.GRANT_UPDATED_TEMPLATE_ID = this.configService.get<string>(
            'GOV_NOTIFY_GRANT_UPDATED_EMAIL_TEMPLATE_ID',
        );
        this.GRANT_CLOSING_TEMPLATE_ID = this.configService.get<string>(
            'GOV_NOTIFY_GRANT_CLOSING_EMAIL_TEMPLATE_ID',
        );
        this.GRANT_OPENING_TEMPLATE_ID = this.configService.get<string>(
            'GOV_NOTIFY_GRANT_OPENING_EMAIL_TEMPLATE_ID',
        );
        this.NEW_GRANTS_EMAIL_TEMPLATE_ID = this.configService.get<string>(
            'GOV_NOTIFY_NEW_GRANTS_EMAIL_TEMPLATE_ID',
        );
        this.HOST = this.configService.get<string>('HOST');
    }

    async processGrantUpdatedNotifications() {
        console.log('Running Process Grant Updated Notifications...');
        const reference = `${
            this.GRANT_UPDATED_TEMPLATE_ID
        }-${new Date().toISOString()}`;
        const grantIds = await this.grantService.findAllUpdatedGrants();

        for (const grantId of grantIds) {
            const subscriptions =
                await this.subscriptionService.findAllByContentGrantSubscriptionId(
                    grantId,
                );
            for (const subscription of subscriptions) {
                const contentfulGrant = await this.contentfulService.fetchEntry(
                    grantId,
                );

                const personalisation = {
                    'name of grant': contentfulGrant.fields.grantName,
                    'link to specific grant': `${this.HOST}/grants/${contentfulGrant.fields.label}`,
                };

                this.emailService.send(
                    subscription.user.emailAddress,
                    this.GRANT_UPDATED_TEMPLATE_ID,
                    personalisation,
                    reference,
                );
            }
        }
        const update = {
            grantUpdated: {
                'en-US': false,
            },
        };
        await this.contentfulService.updateEntries(grantIds, update);
    }

    async processGrantUpcomingNotifications() {
        console.log('Running Process Grant Upcoming Notifications...');
        const grants = [
            ...(await this.grantService.findAllUpcomingClosingGrants()),
            ...(await this.grantService.findAllUpcomingOpeningGrants()),
        ];
        const reference = `${
            this.GRANT_CLOSING_TEMPLATE_ID
        }-${Date.toString()}`;
        for (const grant of grants) {
            const subscriptions =
                await this.subscriptionService.findAllByContentGrantSubscriptionId(
                    grant.sys.id,
                );
            for (const subscription of subscriptions) {
                const grantEventDate = new Date(
                    grant.closing
                        ? grant.fields.grantApplicationCloseDate
                        : grant.fields.grantApplicationOpenDate,
                );
                const personalisation = {
                    'Name of grant': grant.fields.grantName,
                    'link to specific grant': `${this.HOST}/grants/${grant.fields.label}`,
                    date: grantEventDate.toLocaleString('en-GB', {
                        timeZone: 'UTC',
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                    }),
                };

                this.emailService.send(
                    subscription.user.emailAddress,
                    grant.closing
                        ? this.GRANT_CLOSING_TEMPLATE_ID
                        : this.GRANT_OPENING_TEMPLATE_ID,
                    personalisation,
                    reference,
                );
            }
        }
    }

    async processNewGrantsNotifications() {
        console.log('Running Process New Grants Notifications...');
        const reference = `${
            this.NEW_GRANTS_EMAIL_TEMPLATE_ID
        }-${new Date().toISOString()}`;
        const last7days = DateTime.now().minus({ days: 7 }).startOf('day');
        const today = DateTime.now();

        const newGrants = await this.grantService.findGrantsPublishedAfterDate(
            last7days.toJSDate(),
        );
        if (newGrants.length > 0) {
            const newsletters = await this.newsletterService.findAllByType(
                NewsletterType.NEW_GRANTS,
            );
            for (const newsletter of newsletters) {
                const personalisation = {
                    "Link to new grant summary page": new URL(
                        `grants?searchTerm=&from-day=${last7days.day}&from-month=${last7days.month}&from-year=${last7days.year}&to-day=${today.day}&to-month=${today.month}&to-year=${today.year}`,
                        this.HOST,
                    ),
                };

                this.emailService.send(
                    newsletter.user.emailAddress,
                    this.NEW_GRANTS_EMAIL_TEMPLATE_ID,
                    personalisation,
                    reference,
                );
            }
        }
    }
}
