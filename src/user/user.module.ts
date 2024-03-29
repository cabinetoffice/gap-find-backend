import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EncryptionModule } from '../encryption/encryption.module';
import { HashModule } from '../hash/hash.module';
import { User } from './user.entity';
import { UserService } from './user.service';
import { UserSubscriber } from './user.subscriber';
import { UserController } from './user.controller';
@Module({
    imports: [TypeOrmModule.forFeature([User]), EncryptionModule, HashModule],
    providers: [UserService, UserSubscriber],
    exports: [UserService],
    controllers: [UserController],
})
export class UserModule {}
