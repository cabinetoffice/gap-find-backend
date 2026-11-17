import {
    Column,
    CreateDateColumn,
    Entity,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
    Unique,
} from 'typeorm';
import { User } from '../user/user.entity';

@Entity()
@Unique(['userId', 'contentfulGrantId'])
export class Favourite {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    userId: number;

    @Column({ name: 'contentful_grant_id' })
    contentfulGrantId: string;

    @CreateDateColumn({ type: 'timestamptz' })
    createdAt: Date;

    @ManyToOne(() => User, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'userId' })
    user: User;
}
