import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, BaseEntity } from 'typeorm';
import { Exclude } from 'class-transformer';

@Entity({ name: 'MintSaleTransaction' })
export class MintSaleTransaction extends BaseEntity {
    @PrimaryGeneratedColumn('uuid')
    readonly id: string;

    @Column({ default: 0, comment: 'Block height of transaction.' })
    readonly height: number;

    @Column({ comment: 'Transaction hash of transaction.' })
    readonly txHash: string;

    @Column({ comment: 'Transaction time of transaction.' })
    readonly txTime: number;

    @Column({ comment: 'Transaction sender of transaction.' })
    readonly sender: string;

    @Column({ comment: 'NFT Recipient of current transaction.' })
    readonly recipient: string;

    @Column({ comment: 'The contract address' })
    readonly address: string;

    @Column({ default: 0, comment: 'The tier id for the collection.' })
    readonly tierId: number;

    @Column({ comment: 'Collection associated token contract address, Erc721 contract' })
    readonly tokenAddress: string;

    @Column({ comment: 'The token id received by the user' })
    readonly tokenId: string;

    @Column({ comment: 'The tier price' })
    readonly price: string;

    @Column({ comment: 'The payment token address' })
    readonly paymentToken: string;

    @Column({ default: 1, comment: 'The chain id for the MintSale record.' })
    readonly chainId?: number;

    @Column({ default: false, comment: 'Whether the metadata had beed uploaded.' })
    readonly isUploaded: boolean;

    @CreateDateColumn({
        precision: 3
    })
    @Exclude()
    readonly createdAt: Date;

    @UpdateDateColumn()
    @Exclude()
    readonly updatedAt: Date;
}
