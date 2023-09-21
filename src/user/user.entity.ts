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

@Entity({ name: 'gap_user' })
export class User {
    @PrimaryGeneratedColumn()
    id: number;

    @Index({ unique: true })
    @Column({ name: 'hashed_email_address' })
    hashedEmailAddress: string;

    @Column({ name: 'encrypted_email_address' })
    encryptedEmailAddress: string;

    @Column({ nullable: true })
    sub: string;

    @OneToMany(() => Subscription, (subscription) => subscription.user)
    subscriptions: Subscription[];

    @OneToMany(() => Newsletter, (newsletter) => newsletter.user)
    newsletterSubscriptions: Newsletter[];

    @OneToMany(() => SavedSearch, (savedSearch) => savedSearch.user)
    savedSearches: SavedSearch[];

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    decryptEmail?: () => Promise<string>;

    emailAddress?: string;
}
