import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, BaseEntity } from 'typeorm';
import { Exclude } from 'class-transformer';

@Entity({ name: 'Asset721' })
export class Asset721 extends BaseEntity {
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

    @Column({ comment: 'The owner of token id.' })
    readonly owner: string;

    @Column({ default: 1, comment: 'The chain id for the transaction.' })
    readonly chainId?: number;

    @CreateDateColumn({
        precision: 3
    })
    @Exclude()
    readonly createdAt: Date;

    @UpdateDateColumn()
    @Exclude()
    readonly updatedAt: Date;
}
