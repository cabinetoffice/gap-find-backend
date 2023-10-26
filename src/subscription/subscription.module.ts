import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Subscription } from './subscription.entity';
import { SubscriptionService } from './subscription.service';
import { EncryptionModule } from '../encryption/encryption.module';
import { HashModule } from '../hash/hash.module';
import { SubscriptionController } from './subscription.controller';
import { UserModule } from 'src/user/user.module';
import { Unsubscribe } from '../notifications/v2/unsubscribe/unsubscribe.entity';
import { UnsubscribeService } from '../notifications/v2/unsubscribe/unsubscribe.service';

@Module({
    imports: [
        TypeOrmModule.forFeature([Subscription, Unsubscribe]),
        EncryptionModule,
        HashModule,
        UserModule,
    ],
    providers: [SubscriptionService, UnsubscribeService],
    exports: [SubscriptionService],
    controllers: [SubscriptionController],
})
export class SubscriptionModule {}
