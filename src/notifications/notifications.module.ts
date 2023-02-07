import { Module } from '@nestjs/common';
import { NewsletterModule } from 'src/newsletter/newsletter.module';
import { ContentfulModule } from '../contentful/contenful.module';
import { EmailModule } from '../email/email.module';
import { GrantModule } from '../grant/grant.module';
import { SubscriptionModule } from '../subscription/subscription.module';
import { NotificationsService } from './notifications.service';

@Module({
    imports: [SubscriptionModule, EmailModule, GrantModule, ContentfulModule, NewsletterModule],
    providers: [NotificationsService],
    exports: [NotificationsService],
})
export class NotificationsModule {}
