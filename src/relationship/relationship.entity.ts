import {
    BaseEntity,
    CreateDateColumn,
    Entity,
    Index,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from 'typeorm';
import { Wallet } from '../wallet/wallet.entity';

@Entity({ name: 'Relationship' })
@Index(['follower', 'following'], { unique: true })
export class Relationship extends BaseEntity {
    @PrimaryGeneratedColumn('uuid')
    readonly id: string;

    @ManyToOne(() => Wallet, (wallet) => wallet.followers, { createForeignKeyConstraints: false })
    @JoinColumn()
    readonly follower: Wallet;

    @ManyToOne(() => Wallet, (wallet) => wallet.followings, { createForeignKeyConstraints: false })
    @JoinColumn()
    readonly following: Wallet;

    @CreateDateColumn()
    readonly createdAt: Date;

    @UpdateDateColumn()
    readonly updatedAt: Date;
}
