import { Module } from '@nestjs/common';
import { ScheduleModule, SchedulerRegistry } from '@nestjs/schedule';
import { NotificationsModule } from '../notifications/notifications.module';
import { Connection } from 'typeorm';
import { SchedulerProviders } from './scheduler.providers';

@Module({
    imports: [SchedulerModule, NotificationsModule],
    providers: [...SchedulerProviders],
})
export class SchedulerModule {
    constructor(
        private connection: Connection,
        private schedulerRegistry: SchedulerRegistry,
    ) {}
}
