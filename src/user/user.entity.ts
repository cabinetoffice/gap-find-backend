import {
    Column,
    CreateDateColumn,
    Entity,
    Index,
    OneToMany,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from 'typeorm';
import { Newsletter } from '../newsletter/newsletter.entity';
import { SavedSearch } from '../saved_search/saved_search.entity';
import { Subscription } from '../subscription/subscription.entity';
import { SavedSearchNotification } from '../saved_search_notification/saved_search_notification.entity';

@Entity({ name: 'gap_user' })
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

    @OneToMany(() => SavedSearch, (savedSearch) => savedSearch.user)
    savedSearches: SavedSearch[];

    @OneToMany(() => SavedSearchNotification, (savedSearch) => savedSearch.user)
    savedSearchNotifications: SavedSearch[];

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    decryptEmail?: () => Promise<string>;

    emailAddress?: string;

    @Column({ type: 'uuid', nullable: true })
    sub: string;
}
