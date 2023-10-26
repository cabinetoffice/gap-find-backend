import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NewsletterController } from './newsletter.controller';
import { Newsletter } from './newsletter.entity';
import { NewsletterService } from './newsletter.service';
import { HashModule } from '../hash/hash.module';
import { UserModule } from '../user/user.module';
import { Unsubscribe } from '../notifications/v2/unsubscribe/unsubscribe.entity';
import { UnsubscribeService } from '../notifications/v2/unsubscribe/unsubscribe.service';

@Module({
    imports: [
        TypeOrmModule.forFeature([Newsletter, Unsubscribe]),
        HashModule,
        UserModule,
    ],
    providers: [NewsletterService, UnsubscribeService],
    exports: [NewsletterService],
    controllers: [NewsletterController],
})
export class NewsletterModule {}
