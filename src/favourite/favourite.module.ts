import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserModule } from '../user/user.module';
import { FavouriteController } from './favourite.controller';
import { Favourite } from './favourite.entity';
import { FavouriteService } from './favourite.service';

@Module({
    imports: [TypeOrmModule.forFeature([Favourite]), UserModule],
    providers: [FavouriteService],
    exports: [FavouriteService],
    controllers: [FavouriteController],
})
export class FavouriteModule {}
