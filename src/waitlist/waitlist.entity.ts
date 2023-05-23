import {
    Entity,
    Column,
    JoinColumn,
    PrimaryGeneratedColumn,
    CreateDateColumn,
    UpdateDateColumn,
    BaseEntity,
    ManyToOne,
    Index,
    Generated,
} from 'typeorm';
import { lowercaseTransformer } from '../lib/transformer/lowercase.transformer';

@Entity({ name: 'Waitlist' })
@Index(['email', 'address', 'kind'], { unique: true })
export class Waitlist extends BaseEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ comment: 'The email of the user.', transformer: lowercaseTransformer })
    email: string;

    @Column({
        length: 64,
        comment: 'The Ethereum address of the user wallet',
        transformer: lowercaseTransformer,
    })
    address: string;

    @Column({ comment: 'The user position in the waitinglist', default: false })
    isClaimed: boolean;

    @Column({ default: 'Other', comment: 'The kind of the waitlist' })
    kind: string;

    @Column({ comment: 'The user seat number in the waitinglist' })
    @Generated('increment')
    seatNumber: number;

    @Column({ nullable: true, comment: 'The twitter handle for the user.' })
    twitter?: string;

    @Column({ nullable: true, comment: 'The date the user was tweeted at' })
    tweetedAt?: string;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
