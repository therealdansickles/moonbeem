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

@Entity({ name: 'Waitlist' })
export class Waitlist extends BaseEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ unique: true, comment: 'The email of the user.' })
    email: string;

    @Column({ length: 64, unique: true, comment: 'The Ethereum address of the user wallet' })
    address: string;

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
