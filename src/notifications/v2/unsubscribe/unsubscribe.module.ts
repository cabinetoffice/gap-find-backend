import { Module } from '@nestjs/common';
import { UserModule } from 'src/user/user.module';
import { UnsubscribeService } from './unsubscribe.service';
import { UnsubscribeController } from './unsubscribe.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Unsubscribe } from './unsubscribe.entity';

@Module({
    imports: [TypeOrmModule.forFeature([Unsubscribe])],
    providers: [UnsubscribeService],
    exports: [UnsubscribeService],
    controllers: [UnsubscribeController],
})
export class UnsubscribeModule {}
