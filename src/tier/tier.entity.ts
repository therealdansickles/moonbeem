import {
    Entity,
    Column,
    JoinColumn,
    PrimaryGeneratedColumn,
    CreateDateColumn,
    UpdateDateColumn,
    BaseEntity,
    ManyToOne,
    Index,
} from 'typeorm';
import { Exclude } from 'class-transformer';
import { Wallet } from '../wallet/wallet.entity';
import { Collection } from '../collection/collection.entity';

export class Attribute {
    display_type?: string;
    trait_type: string;
    value: any;
}

@Entity({ name: 'Tier' })
@Index(['collection.id', 'tierId'], { unique: true })
@Index(['collection.id', 'beginId'], { unique: true })
@Index(['collection.id', 'endId'], { unique: true })
export class Tier extends BaseEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @CreateDateColumn()
    @Exclude()
    createdAt: Date;

    @UpdateDateColumn()
    @Exclude()
    updatedAt: Date;

    @ManyToOne(() => Collection, (collection) => collection.tiers)
    @JoinColumn()
    collection: Collection;

    // This in part drives the following fields:
    // * `beginId`
    // * `endId`
    @Column({ comment: 'The total number of NFTs in this tier.' })
    totalMints: number;

    // NOTE: Keeping it consistent with the contract naming.
    // https://github.com/vibexyz/vibe-contract/blob/cd578e468362a6e6fc77537c99fd33573b80e0c4/contracts/mint/NFTMintSaleMultiple.sol#L28-L33

    // see https://github.com/vibexyz/vibe-contract/blob/main/contracts/mint/NFTMintSaleMultiple.sol#L35
    // This is used by the contract to determine which tier the NFT belongs to.
    // These are nullable as we need to wait for the contract information to have these availble.
    @Column({ nullable: true, comment: 'The tier id/index of the NFTs in this tier.' })
    tierId?: number;

    @Column({ nullable: true, comment: 'The starting id/index of the NFTs in this tier.' })
    beginId?: number;

    @Column({ nullable: true, comment: 'The ending id/index of the NFTs in this tier.' })
    endId?: number;

    // The following fields are some of the metadata standards from OpenSea / BNB for ERC-721 / ERC-1155s
    // We primarily support most of their fields (minus something like `image_data`)
    // https://docs.opensea.io/docs/contract-level-metadata
    // https://docs.opensea.io/docs/metadata-standards
    // https://docs.bnbchain.org/docs/nft-metadata-standard/

    // Can be just about any type of image (including SVGs, which will be cached into PNGs by OpenSea),
    // and can be IPFS URLs or paths. We recommend using a 350 x 350 image.
    @Column({ nullable: true, length: 500, comment: 'This is the URL to the image of the item.' })
    image?: string;

    @Column({
        nullable: true,
        length: 500,
        comment:
            "This is the URL that will appear with the asset's image and allow users to leave the marketplace and view the item on your site.",
    })
    externalUrl?: string;

    @Column({ length: 64, comment: 'The name of the tier/item.' })
    name: string;

    // Using BNB's max length
    // https://docs.bnbchain.org/docs/nft-metadata-standard/
    @Column({
        nullable: true,
        length: 500,
        comment: 'A human readable description of the item. Markdown is supported.',
    })
    description?: string;

    @Column({
        nullable: true,
        type: 'jsonb',
        comment:
            'A JSON object with arbitrary data. This can be used to store any additional information about the item.',
    })
    attributes?: string;

    @Column({
        nullable: true,
        length: 6,
        comment: 'Background color of the item. Must be a six-character hexadecimal without a pre-pended #.',
    })
    backgroundColor?: string;

    @Column({ default: '', comment: 'If this is a whitelisted collection, then there will be merekleRoot here' })
    merkleRoot?: string;

    @Column({ nullable: true, length: 500, comment: 'A URL to a multi-media attachment for the item.' })
    animationUrl?: string;
}
