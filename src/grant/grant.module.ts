import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ContentfulModule } from '../contentful/contenful.module';
import { EmailModule } from '../email/email.module';
import { SearchModule } from '../search/search.module';
import { GrantService } from './grant.service';

@Module({
    imports: [EmailModule, SearchModule, ContentfulModule],
    providers: [GrantService],
    exports: [GrantService],
})
export class GrantModule {}
