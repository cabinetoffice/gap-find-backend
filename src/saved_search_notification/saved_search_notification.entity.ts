import {
    Column,
    CreateDateColumn,
    Entity,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from 'typeorm';

@Entity()
export class SavedSearchNotification {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    emailAddress: string;

    @Column()
    savedSearchName: string;

    @Column()
    resultsUri: string;

    // TODO confirm if this is actually needed
    @Column({ default: false })
    emailSent: boolean;

    @CreateDateColumn({ type: 'timestamptz' })
    createdAt: Date;

    @UpdateDateColumn({ type: 'timestamptz' })
    updatedAt: Date;
}
