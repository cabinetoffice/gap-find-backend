import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Connection, getConnectionOptions } from 'typeorm';
import { SchedulerModule } from './scheduler/scheduler.module';
import { ScheduledJob } from './scheduler/scheduled-job.entity';
import { GrantModule } from './grant/grant.module';
import { SubscriptionModule } from './subscription/subscription.module';
import { EmailModule } from './email/email.module';
import { Subscription } from './subscription/subscription.entity';
import { NotificationsModule } from './notifications/notifications.module';
import { ScheduleModule } from '@nestjs/schedule';
import { ConfigModule } from '@nestjs/config';
import { SearchModule } from './search/search.module';
import { ContentfulModule } from './contentful/contenful.module';
import { EncryptionModule } from './encryption/encryption.module';
import { HashModule } from './hash/hash.module';
import { UserModule } from './user/user.module';
import { User } from './user/user.entity';
import { Newsletter } from './newsletter/newsletter.entity';
import { NewsletterModule } from './newsletter/newsletter.module';

@Module({
    imports: [
        TypeOrmModule.forRootAsync({
            useFactory: async () => {
                return {
                    type: 'postgres',
                    url: process.env.DATABASE_URL,
                    entities: [ScheduledJob, Subscription, User, Newsletter],
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
    ],
    controllers: [],
    providers: [],
})
export class AppModule {
    constructor(private connection: Connection) {}
}
