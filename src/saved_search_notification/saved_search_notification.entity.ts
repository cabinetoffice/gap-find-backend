import { SavedSearch } from '../saved_search/saved_search.entity';
import {
    Column,
    CreateDateColumn,
    Entity,
    JoinColumn,
    OneToOne,
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
    resultsUri: string;

    // TODO confirm if this is actually needed
    @Column({ default: false })
    emailSent: boolean;

    @OneToOne(() => SavedSearch, { eager: true })
    @JoinColumn()
    savedSearch: SavedSearch;

    @CreateDateColumn({ type: 'timestamptz' })
    createdAt: Date;

    @UpdateDateColumn({ type: 'timestamptz' })
    updatedAt: Date;
}
