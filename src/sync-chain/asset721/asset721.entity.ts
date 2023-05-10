import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, BaseEntity } from 'typeorm';
import { Exclude } from 'class-transformer';

@Entity({ name: 'Asset721' })
export class Asset721 extends BaseEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ comment: 'Block height of transaction.' })
    height: number;

    @Column({ comment: 'Transaction hash of transaction.' })
    txHash: string;

    @Column({ comment: 'Transaction time of transaction.' })
    txTime: number;

    @Column({ comment: 'The contract address.' })
    address: string;

    @Column({ comment: 'The token id of contract.' })
    tokenId: string;

    @Column({ comment: 'The owner of token id.' })
    owner: string;

    @Column({ default: 1, comment: 'The chain id for the transaction.' })
    chainId?: number;

    @CreateDateColumn()
    @Exclude()
    createdAt: Date;

    @UpdateDateColumn()
    @Exclude()
    updatedAt: Date;
}
