import { Module } from '@nestjs/common';
import { NewsletterModule } from 'src/newsletter/newsletter.module';
import { SavedSearchModule } from 'src/saved_search/saved_search.module';
import { SavedSearchNotificationModule } from 'src/saved_search_notification/saved_search_notification.module';
import { ContentfulModule } from '../../contentful/contenful.module';
import { EmailModule } from '../../email/email.module';
import { GrantModule } from '../../grant/grant.module';
import { SubscriptionModule } from '../../subscription/subscription.module';
import { v2NotificationsService } from './notifications.service';
import { GrantNotificationsService } from './notifications.grant.service';
import { SavedSearchNotificationsService } from './notifications.savedSearch.service';
import { NotificationsHelper } from './notifications.helper';
import { UnsubscribeService } from './unsubscribe/unsubscribe.service';
import { UnsubscribeModule } from './unsubscribe/unsubscribe.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Unsubscribe } from './unsubscribe/unsubscribe.entity';
import { EncryptionServiceV2 } from '../../encryption/encryptionV2.service';
import { UserModule } from '../../user/user.module';
import { SchedulerLockModule } from 'src/scheduler/scheduler-lock.module';
import { SchedulerLockService } from 'src/scheduler/scheduler-lock.service';
import { ScheduledJob } from 'src/scheduler/scheduled-job.entity';

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
        SchedulerLockModule,
        UserModule,
        TypeOrmModule.forFeature([Unsubscribe, ScheduledJob]),
    ],
    providers: [
        UnsubscribeService,
        v2NotificationsService,
        SchedulerLockService,
        GrantNotificationsService,
        SavedSearchNotificationsService,
        NotificationsHelper,
        EncryptionServiceV2,
    ],
    exports: [v2NotificationsService],
})
export class v2NotificationsModule {}
