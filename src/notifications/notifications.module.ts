import { Module } from '@nestjs/common';
import { NewsletterModule } from 'src/newsletter/newsletter.module';
import { SavedSearchModule } from 'src/saved_search/saved_search.module';
import { SavedSearchNotificationModule } from 'src/saved_search_notification/saved_search_notification.module';
import { ContentfulModule } from '../contentful/contenful.module';
import { EmailModule } from '../email/email.module';
import { GrantModule } from '../grant/grant.module';
import { SubscriptionModule } from '../subscription/subscription.module';
import { NotificationsService } from './notifications.service';
import { v2NotificationsService } from './v2/notifications.service';

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
    providers: [NotificationsService],
    exports: [NotificationsService],
})
export class NotificationsModule {}
