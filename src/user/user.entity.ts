import { Subscription } from '../subscription/subscription.entity';
import { Newsletter } from '../newsletter/newsletter.entity';
import {
    Column,
    CreateDateColumn,
    Entity,
    Index,
    OneToMany,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from 'typeorm';

@Entity({name: "gap_user"})
export class User {
    @PrimaryGeneratedColumn()
    id: number;

    @Index({ unique: true })
    @Column({ name: 'hashed_email_address' })
    hashedEmailAddress: string;

    @Column({ name: 'encrypted_email_address' })
    encryptedEmailAddress: string;

    @OneToMany(() => Subscription, (subscription) => subscription.user)
    subscriptions: Subscription[];

    @OneToMany(() => Newsletter, (newsletter) => newsletter.user)
    newsletterSubscriptions: Newsletter[];

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    emailAddress: string;
}
