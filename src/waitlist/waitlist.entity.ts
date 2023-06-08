import {
    Entity,
    Column,
    PrimaryGeneratedColumn,
    CreateDateColumn,
    UpdateDateColumn,
    BaseEntity,
    Index,
    Generated,
} from 'typeorm';
import { lowercaseTransformer } from '../lib/transformer/lowercase.transformer';

@Entity({ name: 'Waitlist' })
@Index(['email', 'address', 'kind'], { unique: true })
export class Waitlist extends BaseEntity {
    @PrimaryGeneratedColumn('uuid')
    readonly id: string;

    @Column({ comment: 'The email of the user.', transformer: lowercaseTransformer })
    readonly email: string;

    @Column({
        length: 64,
        comment: 'The Ethereum address of the user wallet',
        transformer: lowercaseTransformer,
    })
    readonly address: string;

    @Column({ comment: 'The user position in the waitinglist', default: false })
    readonly isClaimed: boolean;

    @Column({ default: 'Other', comment: 'The kind of the waitlist' })
    readonly kind: string;

    @Column({ comment: 'The user seat number in the waitinglist' })
    @Generated('increment')
    readonly seatNumber: number;

    @Column({ nullable: true, comment: 'The twitter handle for the user.' })
    readonly twitter?: string;

    @Column({ nullable: true, comment: 'The date the user was tweeted at' })
    readonly tweetedAt?: string;

    @CreateDateColumn()
    readonly createdAt: Date;

    @UpdateDateColumn()
    readonly updatedAt: Date;
}
