import { ScheduledJob, ScheduledJobType } from './scheduled-job.entity';
import { Connection } from 'typeorm';
import { NotificationsService } from '../notifications/notifications.service';
import { SchedulerRegistry } from '@nestjs/schedule';
import { CronJob } from 'cron';

export const SchedulerProviders = [
    {
        provide: 'Scheduler',
        useFactory: async (
            connection: Connection,
            notificationService: NotificationsService,
            schedulerRegistry: SchedulerRegistry,
        ) => {
            const scheduledJobRepo = connection.getRepository(ScheduledJob);

            const jobs = await scheduledJobRepo.find();

            console.log(schedulerRegistry.getCronJobs());
            for (const [index, job] of jobs.entries()) {
                console.log(job);
                switch (job.type) {
                    case ScheduledJobType.GRANT_UPDATED:
                        const grantUpdatedJob = new CronJob(job.timer, () => {
                            notificationService.processGrantUpdatedNotifications();
                        });
                        schedulerRegistry.addCronJob(
                            `GRANT_UPDATED_${index}`,
                            grantUpdatedJob,
                        );
                        grantUpdatedJob.start();
                        break;
                    case ScheduledJobType.GRANT_UPCOMING:
                        const grantUpcoming = new CronJob(job.timer, () => {
                            notificationService.processGrantUpcomingNotifications();
                        });
                        schedulerRegistry.addCronJob(
                            `GRANT_UPCOMING${index}`,
                            grantUpcoming,
                        );
                        grantUpcoming.start();
                        break;
                    case ScheduledJobType.NEW_GRANTS:
                        const newGrants = new CronJob(job.timer, () => {
                            notificationService.processNewGrantsNotifications();
                        });
                        schedulerRegistry.addCronJob(
                            `NEW_GRANT${index}`,
                            newGrants,
                        );
                        newGrants.start();
                        break;
                }
            }
        },
        inject: [Connection, NotificationsService, SchedulerRegistry],
    },
];
