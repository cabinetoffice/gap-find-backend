import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserModule } from 'src/user/user.module';
import { SavedSearchController } from './saved_search.controller';
import { SavedSearch } from './saved_search.entity';
import { SavedSearchService } from './saved_search.service';
import { UnsubscribeService } from '../notifications/v2/unsubscribe/unsubscribe.service';
import { Unsubscribe } from '../notifications/v2/unsubscribe/unsubscribe.entity';

@Module({
    imports: [TypeOrmModule.forFeature([SavedSearch, Unsubscribe]), UserModule],
    providers: [SavedSearchService, UnsubscribeService],
    exports: [SavedSearchService],
    controllers: [SavedSearchController],
})
export class SavedSearchModule {}
