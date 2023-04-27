import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, BaseEntity } from 'typeorm';
import { Exclude } from 'class-transformer';

@Entity({ name: 'MintSaleContract' })
export class MintSaleContract extends BaseEntity {
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

    @Column({ length: 64, comment: 'The contract address' })
    address: string;

    @Column({ comment: 'The royalty contract of MintSale' })
    royaltyReceiver: string;

    @Column({ comment: 'The royalty rate of MintSale' })
    royaltyRate: number;

    @Column({ comment: 'The derivative royalty rate of MintSale' })
    derivativeRoyaltyRate: number;

    @Column({ comment: 'Means whether this nft supports derivative royalty' })
    isDerivativeAllowed: boolean;

    @Column({ comment: 'The begin time of the MintSale' })
    beginTime: number;

    @Column({ comment: 'The end time of the MintSale' })
    endTime: number;

    @Column({ comment: 'The tier id of the MintSale' })
    tierId: number;

    @Column({ comment: 'The price of the tier' })
    price: string;

    @Column({ comment: 'The payment token of the collection' })
    paymentToken: string;

    @Column({ comment: 'The start id of the tier' })
    startId: number;

    @Column({ comment: 'The end id of the tier' })
    endId: number;

    @Column({ comment: 'The current id of the tier' })
    currentId: number;

    @Column({ comment: 'The token address(erc721 address) of the collection' })
    tokenAddress: string;

    @Column({ default: 1, comment: 'The chain id for the MintSale.' })
    chainId?: number;

    @CreateDateColumn()
    @Exclude()
    createdAt: Date;

    @UpdateDateColumn()
    @Exclude()
    updatedAt: Date;
}
