import { Module } from '@nestjs/common';
import { UserModule } from 'src/user/user.module';
import { UnsubscribeService } from './unsubscribe.service';
import { UnsubscribeController } from './unsubscribe.controller';

@Module({
    imports: [UserModule],
    providers: [UnsubscribeService],
    exports: [UnsubscribeService],
    controllers: [UnsubscribeController],
})
export class UnsubscribeModule {}
