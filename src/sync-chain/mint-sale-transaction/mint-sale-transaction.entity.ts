import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, BaseEntity } from 'typeorm';
import { Exclude } from 'class-transformer';

@Entity({ name: 'MintSaleTransaction' })
export class MintSaleTransaction extends BaseEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ default: 0, comment: 'Block height of transaction.' })
    height: number;

    @Column({ comment: 'Transaction hash of transaction.' })
    txHash: string;

    @Column({ comment: 'Transaction time of transaction.' })
    txTime: number;

    @Column({ comment: 'Transaction sender of transaction.' })
    sender: string;

    @Column({ comment: 'NFT Recipient of current transaction.' })
    recipient: string;

    @Column({ comment: 'The contract address' })
    address: string;

    @Column({ default: 0, comment: 'The tier id for the collection.' })
    tierId: number;

    @Column({ comment: 'Collection associated token contract address, Erc721 contract' })
    tokenAddress: string;

    @Column({ comment: 'The token id received by the user' })
    tokenId: string;

    @Column({ comment: 'The tier price' })
    price: string;

    @Column({ comment: 'The payment token address' })
    paymentToken: string;

    @Column({ default: 1, comment: 'The chain id for the MintSale record.' })
    chainId?: number;

    @CreateDateColumn()
    @Exclude()
    createdAt: Date;

    @UpdateDateColumn()
    @Exclude()
    updatedAt: Date;
}
