import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

export enum ScheduledJobType {
    GRANT_UPDATED = 'GRANT_UPDATED',
    GRANT_UPCOMING = 'GRANT_UPCOMING',
    NEW_GRANTS = 'NEW_GRANTS',
    SAVED_SEARCH_MATCHES = 'SAVED_SEARCH_MATCHES',
    SAVED_SEARCH_MATCHES_NOTIFICATION = 'SAVED_SEARCH_MATCHES_NOTIFICATION',
}

@Entity({ name: 'scheduled_job' })
export class ScheduledJob {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({
        type: 'enum',
        enum: ScheduledJobType,
    })
    type: ScheduledJobType;

    @Column()
    timer: string;

    @Column({ default: false })
    locked: boolean;
}
