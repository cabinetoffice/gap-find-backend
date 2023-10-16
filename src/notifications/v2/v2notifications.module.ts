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

@Module({
    imports: [
        SubscriptionModule,
        EmailModule,
        GrantModule,
        ContentfulModule,
        NewsletterModule,
        SavedSearchModule,
        SavedSearchNotificationModule,
    ],
    providers: [
        v2NotificationsService,
        GrantNotificationsService,
        SavedSearchNotificationsService,
    ],
    exports: [v2NotificationsService],
})
export class v2NotificationsModule {}
