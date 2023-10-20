import { TypeOrmModule } from '@nestjs/typeorm';
import { Module } from '@nestjs/common';
import { NewsletterModule } from 'src/newsletter/newsletter.module';
import { SavedSearchModule } from 'src/saved_search/saved_search.module';
import { SavedSearchNotificationModule } from 'src/saved_search_notification/saved_search_notification.module';
import { ContentfulModule } from '../contentful/contenful.module';
import { EmailModule } from '../email/email.module';
import { GrantModule } from '../grant/grant.module';
import { SubscriptionModule } from '../subscription/subscription.module';
import { NotificationsService } from './notifications.service';
import { NotificationsHelper } from './v2/notifications.helper';
import { Unsubscribe } from './v2/unsubscribe/unsubscribe.entity';
import { UnsubscribeService } from './v2/unsubscribe/unsubscribe.service';
import { UnsubscribeModule } from './v2/unsubscribe/unsubscribe.module';
import { EncryptionServiceV2 } from 'src/encryption/encryptionV2.service';

@Module({
    imports: [
        TypeOrmModule.forFeature([Unsubscribe]),
        SubscriptionModule,
        EmailModule,
        GrantModule,
        ContentfulModule,
        NewsletterModule,
        SavedSearchModule,
        UnsubscribeModule,
        SavedSearchNotificationModule,
    ],
    providers: [
        NotificationsService,
        UnsubscribeService,
        NotificationsHelper,
        EncryptionServiceV2,
    ],
    exports: [NotificationsService],
})
export class NotificationsModule {}
