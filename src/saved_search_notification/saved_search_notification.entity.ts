import { User } from '../user/user.entity';
import { SavedSearch } from '../saved_search/saved_search.entity';
import {
    Column,
    CreateDateColumn,
    Entity,
    JoinColumn,
    ManyToOne,
    OneToOne,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from 'typeorm';

@Entity()
export class SavedSearchNotification {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    resultsUri: string;

    @ManyToOne(() => User, (user) => user.savedSearchNotifications, {
        onDelete: 'CASCADE',
        eager: true,
    })
    user: User;

    // TODO confirm if this is actually needed
    @Column({ default: false })
    emailSent: boolean;

    @OneToOne(() => SavedSearch, { eager: true, onDelete: 'CASCADE' })
    @JoinColumn()
    savedSearch: SavedSearch;

    @CreateDateColumn({ type: 'timestamptz' })
    createdAt: Date;

    @UpdateDateColumn({ type: 'timestamptz' })
    updatedAt: Date;
}
