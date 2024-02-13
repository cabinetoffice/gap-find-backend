import { Module } from '@nestjs/common';
import { SchedulerRegistry } from '@nestjs/schedule';
import { NotificationsModule } from '../notifications/notifications.module';
import { Connection } from 'typeorm';
import { SchedulerProviders } from './scheduler.providers';
import { v2NotificationsModule } from 'src/notifications/v2/v2notifications.module';

@Module({
    imports: [SchedulerModule, v2NotificationsModule],
    providers: [...SchedulerProviders],
})
export class SchedulerModule {
    constructor(
        private connection: Connection,
        private schedulerRegistry: SchedulerRegistry,
    ) {}
}
