import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SavedSearchNotification } from './saved_search_notification.entity';
import { SavedSearchNotificationService } from './saved_search_notification.service';

@Module({
    imports: [
        TypeOrmModule.forFeature([SavedSearchNotification]),
        ConfigModule,
    ],
    providers: [SavedSearchNotificationService],
    exports: [SavedSearchNotificationService],
})
export class SavedSearchNotificationModule {}
