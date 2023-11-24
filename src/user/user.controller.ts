import {
    Controller,
    Body,
    Patch,
    Query,
    Delete,
    HttpException,
    HttpStatus,
} from '@nestjs/common';
import { UserService } from './user.service';
import { EncryptionServiceV2 } from '../encryption/encryptionV2.service';
import { User } from './user.entity';

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

    @Delete('/delete')
    async delete(@Query('sub') sub: string, @Query('email') email: string) {
        let user: User;
        if (sub) user = await this.userService.findBySub(sub);
        if (email) user = await this.userService.findByEmail(email);

        if (!user)
            throw new HttpException(
                'No user found with the given email or sub',
                HttpStatus.NOT_FOUND,
            );

        this.userService.delete(user.id);
        console.log(`Successfully deleted user ${user}`);
    }
}
