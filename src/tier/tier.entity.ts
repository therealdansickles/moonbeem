import { Exclude } from 'class-transformer';
import {
    BaseEntity, Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, OneToMany,
    PrimaryGeneratedColumn, UpdateDateColumn
} from 'typeorm';

import { Collection } from '../collection/collection.entity';
import { lowercaseTransformer } from '../lib/transformer/lowercase.transformer';
import { Nft } from '../nft/nft.entity';

export class Attribute {
    trait_type: string;
    value: any;
}

export class Condition {
    trait_type: string;
    rules: Attribute;
    update: Attribute;
}

export class Plugin {
    type: string;
    path: string;
}

export class MetadataProperty {
    name: string;
    type: string;
    value: any;
    display_value: string;
}

export class MetadataRule {
    property: string;
    rule: string;
    value: any;
    update: {
        property: string;
        value: any;
    }[];
}

export class MetadataTrigger {
    type: string;
    value: string;
}

export class MetadataCondition {
    operator?: string;
    rules: Array<MetadataRule>;
    trigger: MetadataTrigger;
}

export class Metadata {
    uses: string[];
    title: string[];
    name?: string;
    type?: string;
    external_url?: string;
    image?: string;
    image_url?: string;
    properties: {
        [key: string]: MetadataProperty;
    };
    conditions: MetadataCondition;
}

@Entity({ name: 'Tier' })
export class Tier extends BaseEntity {
    @PrimaryGeneratedColumn('uuid')
    readonly id: string;

    @CreateDateColumn()
    @Exclude()
    readonly createdAt: Date;

    @UpdateDateColumn()
    @Exclude()
    readonly updatedAt: Date;

    @ManyToOne(() => Collection, (collection) => collection.tiers)
    @JoinColumn()
    public collection: Collection;

    @OneToMany(() => Nft, (nft) => nft.collection, { nullable: true })
    readonly nfts?: Nft[];

    // This in part drives the following fields:
    // * `beginId`
    // * `endId`
    @Column({ default: 1, comment: 'The total number of NFTs in this tier.' })
    readonly totalMints: number;

    @Column({ nullable: true, comment: 'The price of NFTs in this tier.' })
    readonly price?: string;

    @Column({
        nullable: true,
        comment: 'The contract address for the payment token associated with purchase of this tier.',
        transformer: lowercaseTransformer,
    })
    readonly paymentTokenAddress?: string;

    // NOTE: Keeping it consistent with the contract naming.
    // https://github.com/vibexyz/vibe-contract/blob/cd578e468362a6e6fc77537c99fd33573b80e0c4/contracts/mint/NFTMintSaleMultiple.sol#L28-L33

    // see https://github.com/vibexyz/vibe-contract/blob/main/contracts/mint/NFTMintSaleMultiple.sol#L35
    // This is used by the contract to determine which tier the NFT belongs to.
    // These are nullable as we need to wait for the contract information to have these availble.
    @Column({ default: 0, comment: 'The tier id/index of the NFTs in this tier.' })
    readonly tierId: number;

    // The following fields are some of the metadata standards from OpenSea / BNB for ERC-721 / ERC-1155s
    // We primarily support most of their fields (minus something like `image_data`)
    // https://docs.opensea.io/docs/contract-level-metadata
    // https://docs.opensea.io/docs/metadata-standards
    // https://docs.bnbchain.org/docs/nft-metadata-standard/

    // Can be just about any type of image (including SVGs, which will be cached into PNGs by OpenSea),
    // and can be IPFS URLs or paths. We recommend using a 350 x 350 image.
    @Column({ nullable: true, length: 500, comment: 'This is the URL to the image of the item.' })
    readonly image?: string;

    @Column({
        nullable: true,
        length: 500,
        comment:
            "This is the URL that will appear with the asset's image and allow users to leave the marketplace and view the item on your site.",
    })
    readonly externalUrl?: string;

    @Column({ length: 64, comment: 'The name of the tier/item.' })
    readonly name: string;

    // Using BNB's max length
    // https://docs.bnbchain.org/docs/nft-metadata-standard/
    @Column({
        nullable: true,
        length: 500,
        comment: 'A human readable description of the item. Markdown is supported.',
    })
    readonly description?: string;

    @Column({
        nullable: true,
        length: 6,
        comment: 'Background color of the item. Must be a six-character hexadecimal without a pre-pended #.',
    })
    readonly backgroundColor?: string;

    @Column({ default: '', comment: 'If this is a whitelisted collection, then there will be merekleRoot here' })
    readonly merkleRoot?: string;

    @Column({ nullable: true, length: 500, comment: 'A URL to a multi-media attachment for the item.' })
    readonly animationUrl?: string;

    @Column({
        default: {},
        type: 'jsonb',
        comment: 'Full metadata info for the tier.',
    })
    readonly metadata: Metadata;
}
