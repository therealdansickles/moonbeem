import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, BaseEntity } from 'typeorm';
import { Exclude } from 'class-transformer';

@Entity({ name: 'MintSaleContract' })
export class MintSaleContract extends BaseEntity {
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

    @Column({ length: 64, comment: 'The contract address' })
    readonly address: string;

    @Column({ comment: 'The royalty contract of MintSale' })
    readonly royaltyReceiver: string;

    @Column({ comment: 'The royalty rate of MintSale' })
    readonly royaltyRate: number;

    @Column({ comment: 'The derivative royalty rate of MintSale' })
    readonly derivativeRoyaltyRate: number;

    @Column({ comment: 'Means whether this nft supports derivative royalty' })
    readonly isDerivativeAllowed: boolean;

    @Column({ comment: 'The begin time of the MintSale' })
    readonly beginTime: number;

    @Column({ comment: 'The end time of the MintSale' })
    readonly endTime: number;

    @Column({ comment: 'The tier id of the MintSale' })
    readonly tierId: number;

    @Column({ comment: 'The price of the tier' })
    readonly price: string;

    @Column({ comment: 'The payment token of the collection' })
    readonly paymentToken: string;

    @Column({ comment: 'The start id of the tier' })
    readonly startId: number;

    @Column({ comment: 'The end id of the tier' })
    readonly endId: number;

    @Column({ comment: 'The current id of the tier' })
    readonly currentId: number;

    @Column({ comment: 'The token address(erc721 address) of the collection' })
    readonly tokenAddress: string;

    @Column({ default: '', comment: 'The id of the collection in the core database' })
    readonly collectionId?: string;

    @Column({ default: '', comment: 'The merkleRoot for each tier, if whitelisting' })
    readonly merkleRoot?: string;

    @Column({ default: '', comment: 'The externalURI for each tier, if whitelisting' })
    readonly externalURI?: string;

    @Column({ default: 0, comment: 'The maxNonWhitelistedPerUser for each tier, if whitelisting' })
    readonly maxNonWhitelistedPerUser?: number;

    @Column({ default: 1, comment: 'The chain id for the MintSale.' })
    readonly chainId?: number;

    @CreateDateColumn()
    @Exclude()
    readonly createdAt: Date;

    @UpdateDateColumn()
    @Exclude()
    readonly updatedAt: Date;
}

export class IMerkleTree {
    root: string;
    data: IStandardMerkleTreeData<string[]>;
    organizationId?: string;
}

export class IStandardMerkleTreeData<T extends any[]> {
    format: 'standard-v1';
    tree: string[];
    values: {
        value: T;
        treeIndex: number;
    }[];
    leafEncoding: string[];
}
