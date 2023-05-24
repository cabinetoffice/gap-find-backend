import {
    Column,
    CreateDateColumn,
    Entity,
    ManyToOne,
    PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from '../user/user.entity';

export enum SavedSearchStatusType {
    DRAFT = 'DRAFT',
    CONFIRMED = 'CONFIRMED',
}

export type Filter = {
    name: string;
    subFilterid: number;
    type: string;
    searchTerm: object | string;
};

@Entity()
export class SavedSearch {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => User, (user) => user.savedSearches, {
        cascade: true,
        eager: true,
    })
    user: User;

    @Column()
    name: string;

    @Column({ name: 'search_term', nullable: true })
    search_term: string;

    @Column({ type: 'json', nullable: true })
    filters: Filter[];

    @Column({ name: 'from_date', nullable: true })
    fromDate: Date;

    @Column({ name: 'to_date', nullable: true })
    toDate: Date;

    @Column({
        type: 'enum',
        enum: SavedSearchStatusType,
        nullable: true,
    })
    status: SavedSearchStatusType;

    @Column({ default: false })
    notifications: boolean;

    @CreateDateColumn()
    createdAt: Date;
}
