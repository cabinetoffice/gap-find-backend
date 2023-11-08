import {
    Body,
    Controller,
    Get,
    Param,
    Patch,
    Post,
    Query,
} from '@nestjs/common';
import { UserService } from '../user/user.service';
import { DeleteResult } from 'typeorm';

import { GetSavedSearchDto } from './get_saved_search.dto';
import { CreateSavedSearchDto } from './saved_search.dto';
import { SavedSearch, SavedSearchStatusType } from './saved_search.entity';
import { SavedSearchService } from './saved_search.service';
import { UnsubscribeService } from '../notifications/v2/unsubscribe/unsubscribe.service';

@Controller('saved-searches')
export class SavedSearchController {
    constructor(
        private savedSearchService: SavedSearchService,
        private userService: UserService,
        private unsubscribeService: UnsubscribeService,
    ) {}

    @Get(':id')
    async getAllByUser(@Param('id') id: string): Promise<SavedSearch[]> {
        return await this.savedSearchService.getAllByUser(id);
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
        @Body() body: { id: string },
        @Query() query: { unsubscribeReference?: string },
    ): Promise<DeleteResult> {
        let user = await this.userService.findBySub(body.id);
        if (!user) {
            user = await this.userService.findByEmail(body.id);
        }
        const deleteResult = await this.savedSearchService.delete(
            savedSearchId,
            user,
        );
        if (query?.unsubscribeReference) {
            await this.unsubscribeService
                .deleteOneById(query.unsubscribeReference)
                .catch((error: unknown) => {
                    console.error(
                        `Failed to unsubscribe from unsubscribeReference:
                            ${
                                query.unsubscribeReference
                            }. error:${JSON.stringify(error)}`,
                    );
                });
        }
        return deleteResult;
    }
}
