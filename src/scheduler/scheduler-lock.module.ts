import { Module } from '@nestjs/common';
import { SchedulerRegistry } from '@nestjs/schedule';
import { Connection } from 'typeorm';
import { SchedulerLockService } from './scheduler-lock.service';
import { ScheduledJob } from './scheduled-job.entity';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
    imports: [SchedulerLockModule, TypeOrmModule.forFeature([ScheduledJob])],
    providers: [SchedulerLockService],
})
export class SchedulerLockModule {
    constructor(
        private connection: Connection,
        private schedulerRegistry: SchedulerRegistry,
    ) {}
}
