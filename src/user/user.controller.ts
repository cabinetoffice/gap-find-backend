import { Controller, Body, Patch } from '@nestjs/common';
import { UserService } from './user.service';
import { EncryptionServiceV2 } from '../encryption/encryptionV2.service';

@Controller('user')
export class UserController {
    constructor(
        private userService: UserService,
        private encryptionServiceV2: EncryptionServiceV2,
    ) {}

    @Patch('/migrate')
    async migrate(@Body('email') email: Buffer, @Body('sub') sub: string) {
        const decryptedEmail = await this.encryptionServiceV2.decryptV2(email);
        return this.userService.migrateOrCreate(decryptedEmail, sub);
    }
}
