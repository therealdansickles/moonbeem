import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, BaseEntity } from 'typeorm';
import { Exclude } from 'class-transformer';

export enum History721Type {
    unknown = 'unknown',
    mint = 'mint',
    transfer = 'transfer',
    burn = 'burn',
}

@Entity({ name: 'History721' })
export class History721 extends BaseEntity {
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

    @Column({ comment: 'The sender of transaction.' })
    sender: string;

    @Column({ comment: 'The nft receiver of transaction.' })
    receiver: string;

    @Column({
        type: 'enum',
        enum: History721Type,
        default: History721Type.unknown,
        comment: 'Transaction type.',
    })
    kind: History721Type;

    @Column({ default: 1, comment: 'The chain id for the transaction.' })
    chainId?: number;

    @CreateDateColumn()
    @Exclude()
    createdAt: Date;

    @UpdateDateColumn()
    @Exclude()
    updatedAt: Date;
}
