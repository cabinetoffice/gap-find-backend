import { Entity, Column, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { User } from '../../../user/user.entity';

export enum NewsletterType {
    NEW_GRANTS = 'NEW_GRANTS',
}

@Entity()
export class Unsubscribe {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(() => User, (user) => user.unsubscribeReferences, {
        eager: true,
    })
    user: User;

    @Column({ nullable: true })
    subscriptionId: string;

    @Column({ nullable: true })
    newsletterId: NewsletterType;

    @Column({ nullable: true })
    savedSearchId: number;
}
