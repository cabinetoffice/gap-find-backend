import { Module } from '@nestjs/common';
import { EncryptionService } from './encryption.service';
import { EncryptionServiceV2 } from './encryptionV2.service';

@Module({
    providers: [EncryptionService, EncryptionServiceV2],
    exports: [EncryptionService, EncryptionServiceV2],
})
export class EncryptionModule {}
