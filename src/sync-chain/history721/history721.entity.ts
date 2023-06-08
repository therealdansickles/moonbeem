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
    readonly id: string;

    @Column({ comment: 'Block height of transaction.' })
    readonly height: number;

    @Column({ comment: 'Transaction hash of transaction.' })
    readonly txHash: string;

    @Column({ comment: 'Transaction time of transaction.' })
    readonly txTime: number;

    @Column({ comment: 'The contract address.' })
    readonly address: string;

    @Column({ comment: 'The token id of contract.' })
    readonly tokenId: string;

    @Column({ comment: 'The sender of transaction.' })
    readonly sender: string;

    @Column({ comment: 'The nft receiver of transaction.' })
    readonly receiver: string;

    @Column({
        type: 'enum',
        enum: History721Type,
        default: History721Type.unknown,
        comment: 'Transaction type.',
    })
    readonly kind: History721Type;

    @Column({ default: 1, comment: 'The chain id for the transaction.' })
    readonly chainId?: number;

    @CreateDateColumn()
    @Exclude()
    readonly createdAt: Date;

    @UpdateDateColumn()
    @Exclude()
    readonly updatedAt: Date;
}
