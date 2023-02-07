import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NewsletterController } from './newsletter.controller';
import { Newsletter } from './newsletter.entity';
import { NewsletterService } from './newsletter.service';
import { HashModule } from '../hash/hash.module';
import { UserModule } from 'src/user/user.module';

@Module({
    imports: [TypeOrmModule.forFeature([Newsletter]), HashModule, UserModule],
    providers: [NewsletterService],
    exports: [NewsletterService],
    controllers: [NewsletterController],
})
export class NewsletterModule {}
