import { User } from '../user/user.entity';
import {
    Column,
    CreateDateColumn,
    Entity,
    ManyToOne,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from 'typeorm';

@Entity()
export class Subscription {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ name: 'contentful_grant_subscription_id' })
    contentfulGrantSubscriptionId: string;

    @CreateDateColumn({type: 'timestamptz'})
    createdAt: Date;

    @UpdateDateColumn({type: 'timestamptz'})
    updatedAt: Date;

    @ManyToOne(() => User, (user) => user.subscriptions)
    user: User
}
