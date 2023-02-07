import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Subscription } from './subscription.entity';
import { SubscriptionService } from './subscription.service';
import { EncryptionModule } from '../encryption/encryption.module';
import { HashModule } from '../hash/hash.module';
import { SubscriptionController } from './subscription.controller';
import { UserModule } from 'src/user/user.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([Subscription]),
        EncryptionModule,
        HashModule,
        UserModule
    ],
    providers: [SubscriptionService],
    exports: [SubscriptionService],
    controllers: [SubscriptionController],
})
export class SubscriptionModule {}
