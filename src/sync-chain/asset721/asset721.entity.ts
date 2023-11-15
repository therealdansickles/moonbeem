import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, BaseEntity } from 'typeorm';
import { Exclude } from 'class-transformer';
import { lowercaseTransformer } from '../../lib/transformer/lowercase.transformer';

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

    @Column({comment: 'The contract address.', transformer: lowercaseTransformer})
    readonly address: string;

    @Column({ comment: 'The token id of contract.' })
    readonly tokenId: string;

    @Column({ comment: 'The owner of token id.', transformer: lowercaseTransformer})
    readonly owner: string;

    @Column({ default: 1, comment: 'The chain id for the transaction.' })
    readonly chainId?: number;

    @Column({ default: '', comment: 'The Erc6551 account.' })
    readonly account: string;

    @CreateDateColumn({
        precision: 3
    })
    @Exclude()
    readonly createdAt: Date;

    @UpdateDateColumn()
    @Exclude()
    readonly updatedAt: Date;
}
