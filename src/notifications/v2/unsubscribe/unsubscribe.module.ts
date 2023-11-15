import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UnsubscribeService } from './unsubscribe.service';
import { UnsubscribeController } from './unsubscribe.controller';
import { Unsubscribe } from './unsubscribe.entity';
import { UserModule } from '../../../user/user.module';

@Module({
    imports: [TypeOrmModule.forFeature([Unsubscribe]), UserModule],
    providers: [UnsubscribeService],
    exports: [UnsubscribeService],
    controllers: [UnsubscribeController],
})
export class UnsubscribeModule {}
