import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { CreateFavouriteDto } from './favourite.dto';
import { Favourite } from './favourite.entity';
import { FavouriteService } from './favourite.service';

@Controller('favourites')
export class FavouriteController {
    constructor(private favouriteService: FavouriteService) {}

    @Post()
    async create(@Body() dto: CreateFavouriteDto): Promise<Favourite> {
        const result = await this.favouriteService.create(dto);
        delete result.user;
        return result;
    }

    @Get('users/:id')
    async findAllByUser(@Param('id') id: string): Promise<Favourite[]> {
        return this.favouriteService.findAllByUser(id);
    }
}
