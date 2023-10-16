import { SchedulerRegistry } from '@nestjs/schedule';
import { CronJob } from 'cron';
import { Connection } from 'typeorm';
import { NotificationsService } from '../notifications/notifications.service';
import { ScheduledJob, ScheduledJobType } from './scheduled-job.entity';
import { v2NotificationsService } from 'src/notifications/v2/notifications.service';

export const SchedulerProviders = [
    {
        provide: 'Scheduler',
        useFactory: async (
            connection: Connection,
            notificationService: NotificationsService,
            v2NotificationsService: v2NotificationsService,
            schedulerRegistry: SchedulerRegistry,
        ) => {
            const scheduledJobRepo = connection.getRepository(ScheduledJob);

            const jobs = await scheduledJobRepo.find();

            console.log(schedulerRegistry.getCronJobs());
            for (const [index, job] of jobs.entries()) {
                if ('v2 flag') {
                    await v2NotificationsService.processScheduledJob(
                        job,
                        index,
                    );
                    continue;
                } else {
                    console.log(job);
                    switch (job.type) {
                        case ScheduledJobType.GRANT_UPDATED:
                            const grantUpdatedJob = new CronJob(
                                job.timer,
                                () => {
                                    notificationService.processGrantUpdatedNotifications();
                                },
                            );
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
                        case ScheduledJobType.SAVED_SEARCH_MATCHES:
                            const savedSearchMatches = new CronJob(
                                job.timer,
                                () => {
                                    notificationService.processSavedSearchMatches();
                                },
                            );
                            schedulerRegistry.addCronJob(
                                `SAVED_SEARCH_MATCHES${index}`,
                                savedSearchMatches,
                            );
                            savedSearchMatches.start();
                            break;
                        case ScheduledJobType.SAVED_SEARCH_MATCHES_NOTIFICATION:
                            const savedSearchMatchesNotification = new CronJob(
                                job.timer,
                                () => {
                                    notificationService.processSavedSearchMatchesNotifications();
                                },
                            );
                            schedulerRegistry.addCronJob(
                                `SAVED_SEARCH_MATCHES_NOTIFICATION_${index}`,
                                savedSearchMatchesNotification,
                            );
                            savedSearchMatchesNotification.start();
                            break;
                    }
                }
            }
        },
        inject: [
            Connection,
            NotificationsService,
            v2NotificationsService,
            SchedulerRegistry,
        ],
    },
];
