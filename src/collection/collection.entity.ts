import {
    Entity,
    Column,
    PrimaryGeneratedColumn,
    CreateDateColumn,
    UpdateDateColumn,
    BaseEntity,
    ManyToOne,
    OneToOne,
    OneToMany,
    JoinColumn,
} from 'typeorm';
import { Exclude } from 'class-transformer';
//import { Contract } from '../contract/contract.entity';
import { Wallet } from '../wallet/wallet.entity';
import { Organization } from '../organization/organization.entity';
import { Collaboration } from '../collaboration/collaboration.entity';
import { Tier } from '../tier/tier.entity';
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
    id: string;

    @Column({ length: 64, unique: true, comment: 'The unique URL-friendly name of the collection.' })
    name: string;

    @Column({
        type: 'enum',
        enum: CollectionKind,
        default: CollectionKind.other,
        comment: 'The type of collection that this is.',
    })
    kind: CollectionKind;

    @ManyToOne(() => Organization, (organization) => organization.collections, {
        eager: true,
        createForeignKeyConstraints: false,
    })
    @JoinColumn()
    organization: Organization;

    @Column({ length: 64, comment: 'The displayed name for the collection.', nullable: true })
    displayName?: string;

    @Column({ nullable: true, comment: 'The collection address', transformer: lowercaseTransformer })
    address?: string;

    @Column({ nullable: true, comment: 'The description for the collection.' })
    about?: string;

    @Column({ nullable: true, comment: "The URL pointing to the collection's avatar." })
    avatarUrl?: string;

    @Column({ nullable: true, comment: "The URL pointing to the collection's background." })
    backgroundUrl?: string;

    @Column('text', {
        default: [],
        array: true,
        comment:
            'This is going to change later as a stronger, association betwen our `User`. The list of artists attached to the collection.',
    })
    artists?: string[];

    @Column('text', { default: [], array: true, comment: 'The list of associated tags for the collection.' })
    tags?: string[];

    @Column({ nullable: true, comment: "The url of the collection's website." })
    websiteUrl?: string;

    @Column({ nullable: true, comment: 'The twitter handle for the collection.' })
    twitter?: string;

    @Column({ nullable: true, comment: 'The instagram handle for the collection' })
    instagram?: string;

    @Column({ nullable: true, comment: 'The discord handle for the collection.' })
    discord?: string;

    @ManyToOne(() => Wallet, (wallet) => wallet.createdCollections)
    @JoinColumn()
    creator: Wallet;

    @OneToMany(() => Tier, (tier) => tier.collection, { nullable: true })
    tiers?: Tier[];

    @ManyToOne(() => Collaboration, (collaboration) => collaboration.collections, { eager: true, nullable: true })
    collaboration?: Collaboration;

    @Column({ nullable: true, default: 1, comment: 'The chain id for the collection.' })
    chainId?: number;

    @Column({ nullable: true, comment: 'The DateTime when the collection was launched.' })
    publishedAt?: Date;

    @CreateDateColumn()
    @Exclude()
    createdAt: Date;

    @UpdateDateColumn()
    @Exclude()
    updatedAt: Date;
}
