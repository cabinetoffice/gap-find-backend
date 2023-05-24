import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Connection } from 'typeorm';
import { ContentfulModule } from './contentful/contenful.module';
import { EmailModule } from './email/email.module';
import { EncryptionModule } from './encryption/encryption.module';
import { GrantModule } from './grant/grant.module';
import { HashModule } from './hash/hash.module';
import { Newsletter } from './newsletter/newsletter.entity';
import { NewsletterModule } from './newsletter/newsletter.module';
import { NotificationsModule } from './notifications/notifications.module';
import { SavedSearch } from './saved_search/saved_search.entity';
import { SavedSearchModule } from './saved_search/saved_search.module';
import { SavedSearchNotification } from './saved_search_notification/saved_search_notification.entity';
import { SavedSearchNotificationModule } from './saved_search_notification/saved_search_notification.module';
import { ScheduledJob } from './scheduler/scheduled-job.entity';
import { SchedulerModule } from './scheduler/scheduler.module';
import { SearchModule } from './search/search.module';
import { Subscription } from './subscription/subscription.entity';
import { SubscriptionModule } from './subscription/subscription.module';
import { User } from './user/user.entity';
import { UserModule } from './user/user.module';
import { HealthCheckModule } from './healthCheck/healthCheck.module';
@Module({
    imports: [
        TypeOrmModule.forRootAsync({
            useFactory: async () => {
                return {
                    type: 'postgres',
                    url: process.env.DATABASE_URL,
                    entities: [
                        ScheduledJob,
                        Subscription,
                        User,
                        Newsletter,
                        SavedSearch,
                        SavedSearchNotification,
                    ],
                    synchronize: false,
                    ssl: process.env.DATABASE_SSL === 'true' ? true : false,
                };
            },
        }),
        ConfigModule.forRoot({
            isGlobal: true,
        }),
        ScheduleModule.forRoot(),
        TypeOrmModule.forFeature([ScheduledJob, Subscription]),
        GrantModule,
        SubscriptionModule,
        SchedulerModule,
        EmailModule,
        NotificationsModule,
        SearchModule,
        ContentfulModule,
        EncryptionModule,
        HashModule,
        UserModule,
        NewsletterModule,
        SavedSearchModule,
        SavedSearchNotificationModule,
        HealthCheckModule,
    ],
    controllers: [],
    providers: [],
})
export class AppModule {
    constructor(private connection: Connection) {}
}
