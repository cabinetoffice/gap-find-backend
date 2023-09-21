import { Controller, Body, Patch } from '@nestjs/common';
import { UserService } from './user.service';

@Controller('user')
export class UserController {
    constructor(private userService: UserService) {}

    @Patch('/migrate')
    async migrate(@Body('email') email: string, @Body('sub') sub: string) {
        return this.userService.migrateOrCreate(email, sub);
    }
}
