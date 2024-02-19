import { SchedulerRegistry } from '@nestjs/schedule';
import { Connection } from 'typeorm';
import { ScheduledJob } from './scheduled-job.entity';
import { v2NotificationsService } from 'src/notifications/v2/notifications.service';

export const SchedulerProviders = [
    {
        provide: 'Scheduler',
        useFactory: async (
            connection: Connection,
            v2NotificationsService: v2NotificationsService,
            schedulerRegistry: SchedulerRegistry,
        ) => {
            const scheduledJobRepo = connection.getRepository(ScheduledJob);

            const jobs = await scheduledJobRepo.find();

            console.log(schedulerRegistry.getCronJobs());
            for (const [index, job] of jobs.entries()) {
                v2NotificationsService.processScheduledJob(job, index);
            }
        },
        inject: [Connection, v2NotificationsService, SchedulerRegistry],
    },
];
