import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

export enum ScheduledJobType {
    GRANT_UPDATED = 'GRANT_UPDATED',
    GRANT_UPCOMING = 'GRANT_UPCOMING',
    NEW_GRANTS = 'NEW_GRANTS',
}

@Entity()
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
}
