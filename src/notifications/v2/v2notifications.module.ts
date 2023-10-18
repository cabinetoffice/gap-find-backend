import { Module } from '@nestjs/common';
import { NewsletterModule } from 'src/newsletter/newsletter.module';
import { SavedSearchModule } from 'src/saved_search/saved_search.module';
import { SavedSearchNotificationModule } from 'src/saved_search_notification/saved_search_notification.module';
import { ContentfulModule } from '../../contentful/contenful.module';
import { EmailModule } from '../../email/email.module';
import { GrantModule } from '../../grant/grant.module';
import { SubscriptionModule } from '../../subscription/subscription.module';
import { v2NotificationsService } from './notifications.service';
import { GrantNotificationsService } from './grant.service';
import { SavedSearchNotificationsService } from './savedsearch.service';
import { NotificationsHelper } from './notification.helper';
import { UnsubscribeService } from './unsubscribe/unsubscribe.service';
import { UnsubscribeModule } from './unsubscribe/unsubscribe.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Unsubscribe } from './unsubscribe/unsubscribe.entity';

@Module({
    imports: [
        SubscriptionModule,
        EmailModule,
        GrantModule,
        ContentfulModule,
        NewsletterModule,
        SavedSearchModule,
        SavedSearchNotificationModule,
        UnsubscribeModule,
        TypeOrmModule.forFeature([Unsubscribe]),
    ],
    providers: [
        UnsubscribeService,
        v2NotificationsService,
        GrantNotificationsService,
        SavedSearchNotificationsService,
        NotificationsHelper,
    ],
    exports: [v2NotificationsService],
})
export class v2NotificationsModule {}
