import {
    Entity,
    Column,
    CreateDateColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from 'typeorm';
import { User } from '../user/user.entity';

export enum NewsletterType {
    NEW_GRANTS = 'NEW_GRANTS',
}

@Entity()
export class Newsletter {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({
        type: 'enum',
        enum: NewsletterType,
    })
    type: NewsletterType;

    @ManyToOne(() => User, (user) => user.newsletterSubscriptions, {
        onDelete: 'CASCADE',
    })
    user: User;

    @CreateDateColumn({ type: 'timestamptz' })
    createdAt: Date;

    @UpdateDateColumn({ type: 'timestamptz' })
    updatedAt: Date;
}
