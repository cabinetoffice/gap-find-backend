import {
    Body,
    Controller,
    Delete,
    Get,
    Param,
    Patch,
    Post,
} from '@nestjs/common';
import { UserService } from '../user/user.service';
import { DeleteResult } from 'typeorm';

import { GetSavedSearchDto } from './get_saved_search.dto';
import { CreateSavedSearchDto } from './saved_search.dto';
import { SavedSearch, SavedSearchStatusType } from './saved_search.entity';
import { SavedSearchService } from './saved_search.service';

@Controller('saved-searches')
export class SavedSearchController {
    constructor(
        private savedSearchService: SavedSearchService,
        private userService: UserService,
    ) {}

    @Get(':plainTextEmailAddress')
    async getAllByUser(
        @Param('plainTextEmailAddress') plainTextEmailAddress: string,
    ): Promise<SavedSearch[]> {
        return await this.savedSearchService.getAllByUser(
            plainTextEmailAddress,
        );
    }

    @Get('/id/:saveSearchId')
    async getById(
        @Param('saveSearchId') saveSearchId: number,
    ): Promise<SavedSearch> {
        return await this.savedSearchService.findById(saveSearchId);
    }

    @Post()
    async create(
        @Body() savedSearchDto: CreateSavedSearchDto,
    ): Promise<SavedSearch> {
        const result = await this.savedSearchService.create(savedSearchDto);
        return result;
    }

    @Patch(':id/status')
    async updateStatus(
        @Param('id') savedSearchId: number,
        @Body() body: { status: SavedSearchStatusType },
    ): Promise<GetSavedSearchDto> {
        const savedSearch: SavedSearch = await this.savedSearchService.findById(
            savedSearchId,
        );
        return this.savedSearchService.updateStatus(savedSearch, body.status);
    }

    @Post(':id/delete')
    async delete(
        @Param('id') savedSearchId: number,
        @Body() body: { email: string },
    ): Promise<DeleteResult> {
        const user = await this.userService.findByEmail(body.email);
        const deleteResult = await this.savedSearchService.delete(
            savedSearchId,
            user,
        );
        return deleteResult;
    }
}
