import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserModule } from 'src/user/user.module';
import { SavedSearchController } from './saved_search.controller';
import { SavedSearch } from './saved_search.entity';
import { SavedSearchService } from './saved_search.service';

@Module({
    imports: [TypeOrmModule.forFeature([SavedSearch]), UserModule],
    providers: [SavedSearchService],
    exports: [SavedSearchService],
    controllers: [SavedSearchController],
})
export class SavedSearchModule {}
