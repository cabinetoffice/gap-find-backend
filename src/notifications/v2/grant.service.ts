import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DateTime } from 'luxon';
import { ContentfulService } from '../../contentful/contentful.service';
import { EmailService } from '../../email/email.service';
import { GrantService } from '../../grant/grant.service';
import { NewsletterType } from '../../newsletter/newsletter.entity';
import { NewsletterService } from '../../newsletter/newsletter.service';
import { SubscriptionService } from '../../subscription/subscription.service';
import { NOTIFICATION_TYPES } from '../notifications.types';
import {
    bacthJobCalc,
    buildUnsubscribeUrl,
    extractEmailFromBatchResponse,
    getBatchFromObjectArray,
    getUserServiceEmailsBySubBatch,
} from './notification.helper';

@Injectable()
export class GrantNotificationsService {
    private GRANT_UPDATED_TEMPLATE_ID: string;
    private GRANT_CLOSING_TEMPLATE_ID: string;
    private GRANT_OPENING_TEMPLATE_ID: string;
    private NEW_GRANTS_EMAIL_TEMPLATE_ID: string;
    private HOST: string;
    private USER_SERVICE_URL: string;

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
        this.USER_SERVICE_URL =
            this.configService.get<string>('USER_SERVICE_URL');
    }

    async processGrantUpdatedNotifications() {
        console.log('Running Process Grant Updated Notifications...');
        const reference = `${
            this.GRANT_UPDATED_TEMPLATE_ID
        }-${new Date().toISOString()}`;
        const grantIds = await this.grantService.findAllUpdatedGrants();
        console.log('Grant Ids: ', grantIds);
        for (const grantId of grantIds) {
            console.log('Inside for grantId of grantIds: ', grantId);
            const subscriptions =
                await this.subscriptionService.findAllByContentGrantSubscriptionId(
                    grantId,
                );
            const batchesCount = bacthJobCalc(subscriptions.length);

            for (let i = 0; i < batchesCount; i++) {
                console.log('Inside for batchesCount: ', batchesCount);
                const batch = getBatchFromObjectArray(
                    subscriptions,
                    i,
                    batchesCount,
                );

                const userServiceSubEmailMap =
                    await getUserServiceEmailsBySubBatch(
                        batch.map((subscription) => subscription.user.sub),
                        this.USER_SERVICE_URL,
                    );

                console.log(userServiceSubEmailMap, 'userServiceSubEmailMap');

                for (const subscription of batch) {
                    console.log('Inside for subscription: ', subscription);
                    const unsubscribeUrl = buildUnsubscribeUrl({
                        id: grantId,
                        emailAddress: subscription.user.encryptedEmailAddress,
                        type: NOTIFICATION_TYPES.GRANT_SUBSCRIPTION,
                    });

                    const contentfulGrant =
                        await this.contentfulService.fetchEntry(grantId);

                    const personalisation = {
                        unsubscribeUrl,
                        'name of grant': contentfulGrant.fields
                            .grantName as string,
                        'link to specific grant': `${this.HOST}/grants/${contentfulGrant.fields.label}`,
                    };

                    const email = extractEmailFromBatchResponse(
                        userServiceSubEmailMap,
                        subscription,
                    );

                    this.emailService.send(
                        email ?? (await subscription.user.decryptEmail()),
                        this.GRANT_UPDATED_TEMPLATE_ID,
                        personalisation,
                        reference,
                    );
                }
            }
        }
        const update = {
            grantUpdated: {
                'en-US': false,
            },
        };
        //await this.contentfulService.updateEntries(grantIds, update);
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
            const grantId = grant.sys.id;
            const subscriptions =
                await this.subscriptionService.findAllByContentGrantSubscriptionId(
                    grantId,
                );
            const batchesCount = bacthJobCalc(subscriptions.length);

            for (let i = 0; i < batchesCount; i++) {
                const batch = getBatchFromObjectArray(
                    subscriptions,
                    i,
                    batchesCount,
                );

                const userServiceSubEmailMap =
                    await getUserServiceEmailsBySubBatch(
                        batch.map((subscription) => subscription.user.sub),
                        this.USER_SERVICE_URL,
                    );

                for (const subscription of batch) {
                    const unsubscribeUrl = buildUnsubscribeUrl({
                        id: grantId,
                        emailAddress: subscription.user.sub,
                        type: NOTIFICATION_TYPES.GRANT_SUBSCRIPTION,
                    });

                    const grantEventDate = new Date(
                        grant.closing
                            ? grant.fields.grantApplicationCloseDate
                            : grant.fields.grantApplicationOpenDate,
                    );

                    const email = extractEmailFromBatchResponse(
                        userServiceSubEmailMap,
                        subscription,
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

                    this.emailService.send(
                        email ?? (await subscription.user.decryptEmail()),
                        grant.closing
                            ? this.GRANT_CLOSING_TEMPLATE_ID
                            : this.GRANT_OPENING_TEMPLATE_ID,
                        personalisation,
                        reference,
                    );
                }
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

            const batchesCount = bacthJobCalc(newsletters.length);

            for (let i = 0; i < batchesCount; i++) {
                const batch = getBatchFromObjectArray(
                    newsletters,
                    i,
                    batchesCount,
                );

                const userServiceSubEmailMap =
                    await getUserServiceEmailsBySubBatch(
                        batch.map((newsletter) => newsletter.user.sub),
                        this.USER_SERVICE_URL,
                    );

                const personalisation = {
                    'Link to new grant summary page': new URL(
                        `grants?searchTerm=&from-day=${last7days.day}&from-month=${last7days.month}&from-year=${last7days.year}&to-day=${today.day}&to-month=${today.month}&to-year=${today.year}`,
                        this.HOST,
                    ),
                };
                for (const newsletter of batch) {
                    const email = extractEmailFromBatchResponse(
                        userServiceSubEmailMap,
                        newsletter,
                    );
                    const unsubscribeUrl = buildUnsubscribeUrl({
                        id: NewsletterType.NEW_GRANTS,
                        emailAddress: newsletter.user.sub,
                        type: NOTIFICATION_TYPES.NEWSLETTER,
                    });

                    await this.emailService.send(
                        email ?? (await newsletter.user.decryptEmail()),
                        this.NEW_GRANTS_EMAIL_TEMPLATE_ID,
                        { ...personalisation, unsubscribeUrl },
                        reference,
                    );
                }
            }
        }
    }
}
