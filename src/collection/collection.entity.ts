import {
    BaseEntity,
    Column,
    CreateDateColumn,
    Entity,
    JoinColumn,
    ManyToOne,
    OneToMany,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from 'typeorm';

import { Collaboration } from '../collaboration/collaboration.entity';
import { Exclude } from 'class-transformer';
import { Nft } from '../nft/nft.entity';
import { Organization } from '../organization/organization.entity';
import { Redeem } from '../redeem/redeem.entity';
import { Tier } from '../tier/tier.entity';
import { Wallet } from '../wallet/wallet.entity';
import { lowercaseTransformer } from '../lib/transformer/lowercase.transformer';

// see https://stackoverflow.com/questions/55598213/enums-not-working-with-nestjs-and-graphql
export enum CollectionKind {
    edition = 'edition', // single NFT.
    tiered = 'tiered', // Multiple NFTs with different prices and attributes.
    bulk = 'bulk', // Bulk generation of NFTs.
    other = 'other', // unknow type
    whitelistEdition = 'whitelistEdition',
    whitelistTiered = 'whitelistTiered',
    whitelistBulk = 'whitelistBulk',
}

@Entity({ name: 'Collection' })
export class Collection extends BaseEntity {
    @PrimaryGeneratedColumn('uuid')
    readonly id: string;

    @Column({ length: 64, unique: true, comment: 'The unique URL-friendly name of the collection.' })
    readonly name: string;

    @Column({
        type: 'enum',
        enum: CollectionKind,
        default: CollectionKind.other,
        comment: 'The type of collection that this is.',
    })
    readonly kind: CollectionKind;

    @ManyToOne(() => Organization, (organization) => organization.collections, {
        eager: true,
        createForeignKeyConstraints: false,
    })
    @JoinColumn()
    readonly organization: Organization;

    @Column({ length: 64, comment: 'The displayed name for the collection.', nullable: true })
    readonly displayName?: string;

    @Column({ nullable: true, comment: 'The collection address', transformer: lowercaseTransformer })
    readonly address?: string;

    @Column({ nullable: true, comment: 'The description for the collection.' })
    readonly about?: string;

    @Column({ nullable: true, comment: "The URL pointing to the collection's avatar." })
    readonly avatarUrl?: string;

    @Column({ nullable: true, comment: "The URL pointing to the collection's background." })
    readonly backgroundUrl?: string;

    @Column('text', {
        default: [],
        array: true,
        comment:
            'This is going to change later as a stronger, association betwen our `User`. The list of artists attached to the collection.',
    })
    readonly artists?: string[];

    @Column('text', { default: [], array: true, comment: 'The list of associated tags for the collection.' })
    readonly tags?: string[];

    @Column({ nullable: true, comment: "The url of the collection's website." })
    readonly websiteUrl?: string;

    @Column({ nullable: true, comment: 'The twitter handle for the collection.' })
    readonly twitter?: string;

    @Column({ nullable: true, comment: 'The instagram handle for the collection' })
    readonly instagram?: string;

    @Column({ nullable: true, comment: 'The discord handle for the collection.' })
    readonly discord?: string;

    @ManyToOne(() => Wallet, (wallet) => wallet.createdCollections)
    @JoinColumn()
    readonly creator: Wallet;

    @OneToMany(() => Tier, (tier) => tier.collection, { nullable: true })
    public tiers?: Tier[];

    @OneToMany(() => Nft, (nft) => nft.collection, { nullable: true })
    readonly nfts?: Nft[];

    @ManyToOne(() => Collaboration, (collaboration) => collaboration.collections, { eager: true, nullable: true })
    readonly collaboration?: Collaboration;

    @Column({ nullable: true, default: 1, comment: 'The chain id for the collection.' })
    readonly chainId?: number;

    @OneToMany(() => Redeem, (redeem) => redeem.collection, { nullable: true })
    readonly redeems?: Redeem[];

    @Column({
        nullable: true,
        comment:
            "Temporary field for store collection name in Opensea, while we can't retrieve collection stat by address",
    })
    readonly nameOnOpensea?: string;

    @Column({ nullable: true, comment: 'The DateTime when the collection was launched.' })
    readonly publishedAt?: Date;

    @CreateDateColumn()
    @Exclude()
    readonly createdAt: Date;

    @UpdateDateColumn()
    @Exclude()
    readonly updatedAt: Date;
}
