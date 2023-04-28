import {
    Entity,
    Column,
    PrimaryGeneratedColumn,
    CreateDateColumn,
    UpdateDateColumn,
    BaseEntity,
    ManyToOne,
    JoinColumn,
    Index,
} from 'typeorm';
import { Collection } from '../collection/collection.entity';
import { Wallet } from '../wallet/wallet.entity';

@Entity({ name: 'Collaboration' })
@Index(['wallet.id', 'collection.id'], { unique: true })
export class Collaboration extends BaseEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ nullable: true, length: 64, unique: true, comment: 'The Ethereum address' })
    address?: string;

    @Column({ nullable: true, length: 64 })
    factoryAddress?: string;

    @Column({ default: 100, comment: 'The royalty rate in percentage.' })
    royaltyRate: number;

    @ManyToOne(() => Collection, (collection) => collection.collaborations, { createForeignKeyConstraints: false })
    @JoinColumn()
    collection: Collection;

    @ManyToOne(() => Wallet, (wallet) => wallet.collaborations, { createForeignKeyConstraints: false })
    @JoinColumn()
    wallet: Wallet;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
