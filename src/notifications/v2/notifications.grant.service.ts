import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DateTime } from 'luxon';
import { ContentfulService } from '../../contentful/contentful.service';
import { EmailService } from '../../email/email.service';
import { GrantService } from '../../grant/grant.service';
import { Newsletter, NewsletterType } from '../../newsletter/newsletter.entity';
import { NewsletterService } from '../../newsletter/newsletter.service';
import { SubscriptionService } from '../../subscription/subscription.service';
import {
    NotificationWithAttachedUser,
    NotificationsHelper,
    extractEmailFromBatchResponse,
} from './notifications.helper';
import { Subscription } from '../../subscription/subscription.entity';
import { ContentfulGrant } from '../../grant/grant.interfaces';

@Injectable()
export class GrantNotificationsService {
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
        private notificationsHelper: NotificationsHelper,
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

    private sendNewGrantsEmailsToBatch = async (
        batchOfNewsletters: Newsletter[],
        last7days: DateTime,
    ) => {
        const today = DateTime.now();
        const userServiceSubEmailMap =
            await this.notificationsHelper.getUserServiceEmailsBySubBatch(
                batchOfNewsletters
                    .map((newsletter) => newsletter.user.sub)
                    .filter((sub) => sub),
            );

        const personalisation = {
            'Link to new grant summary page': new URL(
                `grants?searchTerm=&from-day=${last7days.day}&from-month=${last7days.month}&from-year=${last7days.year}&to-day=${today.day}&to-month=${today.month}&to-year=${today.year}`,
                this.HOST,
            ),
        };
        for (const newsletter of batchOfNewsletters) {
            const email = extractEmailFromBatchResponse(
                userServiceSubEmailMap,
                newsletter,
            );

            const unsubscribeUrl =
                await this.notificationsHelper.buildUnsubscribeUrl({
                    newsletterId: NewsletterType.NEW_GRANTS,
                    user: newsletter.user,
                });

            const emailAddress =
                email ?? (await newsletter.user.decryptEmail());

            await this.emailService.send(
                emailAddress,
                this.NEW_GRANTS_EMAIL_TEMPLATE_ID,
                { ...personalisation, unsubscribeUrl },
                `${
                    this.NEW_GRANTS_EMAIL_TEMPLATE_ID
                }-${new Date().toISOString()}`,
            );
        }
    };

    private sendGrantUpcomingEmailsToBatch = async (
        batchOfSubscriptions: Subscription[],
        grant: ContentfulGrant,
    ) => {
        const userServiceSubEmailMap =
            await this.notificationsHelper.getUserServiceEmailsBySubBatch(
                batchOfSubscriptions
                    .map((subscription) => subscription.user.sub)
                    .filter((sub) => sub),
            );

        for (const subscription of batchOfSubscriptions) {
            const unsubscribeUrl =
                await this.notificationsHelper.buildUnsubscribeUrl({
                    subscriptionId: grant.sys.id,
                    user: subscription.user,
                });

            const grantEventDate = new Date(
                grant.closing
                    ? grant.fields.grantApplicationCloseDate
                    : grant.fields.grantApplicationOpenDate,
            );

            const email = extractEmailFromBatchResponse(
                userServiceSubEmailMap,
                subscription as NotificationWithAttachedUser,
            );

            const personalisation = {
                unsubscribeUrl,
                'Name of grant': grant.fields.grantName,
                'link to specific grant': `${this.HOST}/grants/${grant.fields.label}`,
                date: grantEventDate.toLocaleString('en-GB', {
                    timeZone: 'UTC',
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                }),
            };

            await this.emailService.send(
                email ?? (await subscription.user.decryptEmail()),
                grant.closing
                    ? this.GRANT_CLOSING_TEMPLATE_ID
                    : this.GRANT_OPENING_TEMPLATE_ID,
                personalisation,
                `${this.GRANT_CLOSING_TEMPLATE_ID}-${Date.toString()}`, //"reference"
            );
        }
    };

    private sendGrantUpdatedEmailsToBatch = async (
        batchOfSubscriptions: Subscription[],
        grantId: string,
    ) => {
        const userServiceSubEmailMap =
            await this.notificationsHelper.getUserServiceEmailsBySubBatch(
                batchOfSubscriptions
                    .map((subscription) => subscription.user.sub)
                    .filter((sub) => sub),
            );

        for (const subscription of batchOfSubscriptions as Subscription[]) {
            const unsubscribeUrl =
                await this.notificationsHelper.buildUnsubscribeUrl({
                    subscriptionId: grantId,
                    user: subscription.user,
                });

            const contentfulGrant = await this.contentfulService.fetchEntry(
                grantId,
            );

            const personalisation = {
                unsubscribeUrl,
                'name of grant': contentfulGrant.fields.grantName as string,
                'link to specific grant': `${this.HOST}/grants/${contentfulGrant.fields.label}`,
            };

            const email = extractEmailFromBatchResponse(
                userServiceSubEmailMap,
                subscription,
            );

            await this.emailService.send(
                email ?? (await subscription.user.decryptEmail()),
                this.GRANT_UPDATED_TEMPLATE_ID,
                personalisation,
                `${this.GRANT_UPDATED_TEMPLATE_ID}-${new Date().toISOString()}`,
            );
        }
    };

    processGrantUpdatedNotifications = async () => {
        console.log(
            '[CRON GRANT UPDATED] Running Process Grant Updated Notifications...',
        );
        let emailsSent = 0;
        const grantIds = await this.grantService.findAllUpdatedGrants();
        for (const grantId of grantIds) {
            const subscriptions =
                await this.subscriptionService.findAllByContentGrantSubscriptionId(
                    grantId,
                );

            const batchesCount =
                this.notificationsHelper.getNumberOfBatchesOfNotifications(
                    subscriptions.length,
                );

            for (let i = 0; i < batchesCount; i++) {
                const batch = this.notificationsHelper.getBatchFromObjectArray(
                    subscriptions,
                    i,
                    batchesCount,
                );
                await this.sendGrantUpdatedEmailsToBatch(
                    batch as Subscription[],
                    grantId,
                );
                emailsSent += batch.length;
            }
        }
        console.log(
            `[CRON GRANT UPDATED] Finished sending grant updated emails, ${emailsSent} emails`,
        );
        console.log(`[CRON GRANT UPDATED] Updating contentful...`);
        await this.contentfulService.updateEntries(grantIds, {
            grantUpdated: {
                'en-US': false,
            },
        });
        console.log(
            `[CRON GRANT UPDATED] Finished updating contentful entries`,
        );
    };

    processGrantUpcomingNotifications = async () => {
        console.log(
            '[CRON GRANT UPCOMING] Running Process Grant Upcoming Notifications...',
        );
        let emailsSent = 0;
        const grants = [
            ...(await this.grantService.findAllUpcomingClosingGrants()),
            ...(await this.grantService.findAllUpcomingOpeningGrants()),
        ];

        for (const grant of grants) {
            const grantId = grant.sys.id;
            const subscriptions =
                await this.subscriptionService.findAllByContentGrantSubscriptionId(
                    grantId,
                );
            const batchesCount =
                this.notificationsHelper.getNumberOfBatchesOfNotifications(
                    subscriptions.length,
                );

            for (let i = 0; i < batchesCount; i++) {
                const batch = this.notificationsHelper.getBatchFromObjectArray(
                    subscriptions,
                    i,
                    batchesCount,
                );

                await this.sendGrantUpcomingEmailsToBatch(
                    batch as Subscription[],
                    grant,
                );

                emailsSent += batch.length;
            }
        }
        console.log(
            `[CRON GRANT UPCOMING] Finished sending grant upcoming emails, sent ${emailsSent} emails`,
        );
    };

    processNewGrantsNotifications = async () => {
        console.log(
            '[CRON NEW GRANTS] Running Process New Grants Notifications...',
        );
        let emailsSent = 0;

        const last7days = DateTime.now().minus({ days: 7 }).startOf('day');
        const newGrants = await this.grantService.findGrantsPublishedAfterDate(
            last7days.toJSDate(),
        );
        if (newGrants.length > 0) {
            const newsletters = await this.newsletterService.findAllByType(
                NewsletterType.NEW_GRANTS,
            );
            const batchesCount =
                this.notificationsHelper.getNumberOfBatchesOfNotifications(
                    newsletters.length,
                );
            for (let i = 0; i < batchesCount; i++) {
                const batch = this.notificationsHelper.getBatchFromObjectArray(
                    newsletters,
                    i,
                    batchesCount,
                ) as Newsletter[];

                await this.sendNewGrantsEmailsToBatch(batch, last7days);
                emailsSent += batch.length;
            }
        }
        console.log(
            `[CRON NEW GRANTS] Finished sending new grant emails, ${emailsSent} emails`,
        );
    };
}
