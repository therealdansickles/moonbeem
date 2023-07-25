import {
    IsArray, IsDateString, IsEnum, IsNumber, IsObject, IsOptional, IsString, IsUrl, ValidateIf
} from 'class-validator';
import { GraphQLJSONObject } from 'graphql-type-json';

import {
    Field, Float, InputType, Int, ObjectType, OmitType, PartialType, PickType, registerEnumType
} from '@nestjs/graphql';

import { Collaboration, CollaborationInput } from '../collaboration/collaboration.dto';
import Paginated from '../lib/pagination/pagination.model';
import { Metadata } from '../metadata/metadata.dto';
import { Organization, OrganizationInput } from '../organization/organization.dto';
import { Asset721 } from '../sync-chain/asset721/asset721.dto';
import { MintSaleContract } from '../sync-chain/mint-sale-contract/mint-sale-contract.dto';
import { MintSaleTransaction } from '../sync-chain/mint-sale-transaction/mint-sale-transaction.dto';
import { Tier } from '../tier/tier.dto';
import { Wallet, WalletInput } from '../wallet/wallet.dto';
import { CollectionKind } from './collection.entity';

export const ZeroAccount = '0x0000000000000000000000000000000000000000';

export enum CollectionStatus {
    closed = 'closed',
    upcoming = 'upcoming',
    active = 'active',
}

registerEnumType(CollectionKind, { name: 'CollectionKind' });
registerEnumType(CollectionStatus, { name: 'CollectionStatus' });

@ObjectType('Collection')
export class Collection {
    @IsString()
    @Field({ description: 'The ID for a collection' })
    readonly id: string;

    @IsString()
    @Field({ description: 'The unique URL-friendly identifier for a collection.' })
    readonly name: string;

    @Field(() => CollectionKind, { description: 'The type of collection this is.' })
    readonly kind: CollectionKind;

    @Field(() => Organization, { description: 'The organization that owns the collection.' })
    readonly organization: Organization;

    @IsString()
    @Field({ description: 'The name that we display for the collection.', nullable: true })
    @IsOptional()
    readonly displayName?: string;

    @IsString()
    @Field({ description: 'The description for the collection.', nullable: true })
    readonly about?: string;

    @Field({
        description: "The address of the collection, e.g. '0x6bf9ec331e083627b0f48332ece2d99a7eb7fb0c'",
        nullable: true,
    })
    @IsOptional()
    readonly address?: string;

    @ValidateIf((collection) => collection.avatarUrl !== '')
    @IsUrl()
    @IsOptional()
    @Field({
        description: 'The image url for the avatar of the collection. This is the profile picture.',
        nullable: true,
    })
    readonly avatarUrl?: string;

    @IsUrl()
    @Field({ description: 'The image url for the background of the collection.', nullable: true })
    readonly backgroundUrl?: string;

    @IsUrl()
    @Field({ description: 'The url for the website associated with this collection', nullable: true })
    readonly websiteUrl?: string;

    @IsString()
    @Field({ description: "The twitter handle associated with this collection, e.g. 'vibe-labs'", nullable: true })
    readonly twitter?: string;

    @IsString()
    @Field({ description: "The instagram handle associated with this collection, e.g. 'vibe-labs'", nullable: true })
    readonly instagram?: string;

    @IsString()
    @Field({ description: "The discord handle associated with this collection, e.g. 'vibe-labs", nullable: true })
    readonly discord?: string;

    @IsArray()
    @Field(() => [String], { description: 'The tags associated with this organization.', nullable: true })
    readonly tags?: string[];

    @Field(() => [Tier], { description: 'The collection tiers', nullable: true })
    @IsArray()
    readonly tiers?: Tier[];

    @Field(() => String, {
        nullable: true,
        description:
            "Temporary field for store collection name in Opensea, while we can't retrieve collection stat by address",
    })
    @IsString()
    readonly nameOnOpensea?: string;

    @IsNumber()
    @Field(() => Int, { description: 'The begin time for sales.', nullable: true })
    public beginSaleAt?: number;

    @IsNumber()
    @Field(() => Int, { description: 'The end time for sales.', nullable: true })
    public endSaleAt?: number;

    @IsDateString()
    @Field({ description: 'The DateTime that this collection was published.', nullable: true })
    readonly publishedAt?: Date;

    @IsDateString()
    @Field({ description: 'The DateTime that this collection was created(initially created as a draft).' })
    readonly createdAt: Date;

    @IsDateString()
    @Field({ description: 'The DateTime that this collection was last updated.' })
    readonly updatedAt: Date;

    @IsObject()
    @Field(() => Wallet, { description: 'The wallet that created the collection.', nullable: true })
    readonly creator?: Wallet;

    @IsObject()
    @Field(() => MintSaleContract, { description: 'The collection contract', nullable: true })
    readonly contract?: MintSaleContract;

    @IsObject()
    @Field(() => Collaboration, { description: 'The collaboration of the collection.', nullable: true })
    readonly collaboration?: Collaboration;
}

@InputType()
export class CreateCollectionInput extends OmitType(PartialType(Collection, InputType), [
    'id',
    'organization',
    'tiers',
    'contract',
    'creator',
    'collaboration',
]) {
    @IsObject()
    @Field(() => WalletInput, { description: 'The wallet that created the collection.', nullable: true })
    @IsOptional()
    readonly creator?: WalletInput;

    @IsObject()
    @Field(() => OrganizationInput, { description: 'The organization that owns the collection.' })
    readonly organization: OrganizationInput;

    @IsObject()
    @Field(() => CollaborationInput, { description: 'The collaboration of the collection.', nullable: true })
    @IsOptional()
    readonly collaboration?: CollaborationInput;

    @IsArray()
    @Field(() => [CreateTierInCollectionInput], { description: 'This tiers for collection', nullable: true })
    @IsOptional()
    readonly tiers?: CreateTierInCollectionInput[];
}

@InputType()
export class UpdateCollectionInput extends OmitType(CreateCollectionInput, ['organization', 'tiers']) {
    @IsString()
    @Field({ description: 'The id for a collection.' })
    readonly id: string;
}

@InputType()
export class CollectionInput extends PickType(Collection, ['id'], InputType) {}

@InputType('CreateTierInCollectionInput')
export class CreateTierInCollectionInput {
    @IsNumber()
    @Field(() => Int, { description: 'The total number of mints for this tier.' })
    readonly totalMints: number;

    @IsString()
    @Field({ description: 'The name of the tier.' })
    readonly name: string;

    @IsNumber()
    @Field({ description: 'The id of the tier. should start from 0' })
    readonly tierId: number;

    @Field({ description: 'the tier selected coin id' })
    @IsString()
    readonly paymentTokenAddress: string;

    @IsString()
    @Field({ nullable: true, description: 'The description of the tier.' })
    @IsOptional()
    readonly description?: string;

    @IsString()
    @Field({ nullable: true, description: 'This is the URL to the image of the tier.' })
    @IsOptional()
    readonly image?: string;

    @IsString()
    @Field({
        nullable: true,
        description:
            "This is the URL that will appear with the asset's image and allow users to leave the marketplace and view the tier on your site.",
    })
    @IsOptional()
    readonly externalUrl?: string;

    @IsString()
    @Field({ nullable: true, description: 'This is the URL to the animation of the tier.' })
    @IsOptional()
    readonly animationUrl?: string;

    @Field(() => GraphQLJSONObject, { nullable: true, description: 'The full metadata of the tier.' })
    @IsObject()
    readonly metadata: Metadata;

    @IsString()
    @Field({ nullable: true, description: 'This merekleRoot of tier.' })
    @IsOptional()
    readonly merkleRoot?: string;

    @IsString()
    @Field({ nullable: true, description: 'The price of NFTs in this tier.' })
    @IsOptional()
    readonly price?: string;
}

@ObjectType('CollectionOutput')
export class CollectionOutput extends OmitType(
    Collection,
    [
        'organization',
        'websiteUrl',
        'twitter',
        'instagram',
        'tiers',
        'discord',
        'tags',
        'publishedAt',
        'createdAt',
        'updatedAt',
        'creator',
        'contract',
        'collaboration',
    ],
    ObjectType
) {
    @Field(() => Int)
    @IsNumber()
    readonly totalSupply: number;
}

@ObjectType('SearchCollection')
export class SearchCollection {
    @Field(() => Int)
    @IsNumber()
    readonly total: number;

    @Field(() => [CollectionOutput])
    @IsArray()
    readonly collections: CollectionOutput[];
}

@ObjectType('CollectionStatDataPeriodItem')
export class CollectionStatDataPeriodItem {
    @Field(() => Float, { nullable: true })
    @IsNumber()
    readonly hourly?: number;

    @Field(() => Float, { nullable: true })
    @IsNumber()
    readonly daily?: number;

    @Field(() => Float, { nullable: true })
    @IsNumber()
    readonly weekly?: number;

    @Field(() => Float, { nullable: true })
    @IsNumber()
    readonly monthly?: number;

    @Field(() => Float, { nullable: true })
    @IsNumber()
    readonly total?: number;
}

@ObjectType('CollectionStatDataPaymentToken')
export class CollectionStatDataPaymentToken {
    @Field(() => String, { nullable: true })
    @IsString()
    readonly symbol?: string;

    @Field(() => Float, { nullable: true })
    @IsNumber()
    readonly priceInUSD?: number;
}

@ObjectType('CollectionStatData')
export class CollectionStatData {
    @Field(() => CollectionStatDataPeriodItem, { nullable: true })
    @IsObject()
    readonly volume?: CollectionStatDataPeriodItem;

    @Field(() => CollectionStatDataPeriodItem, { nullable: true })
    @IsObject()
    readonly sales?: CollectionStatDataPeriodItem;

    @Field(() => CollectionStatDataPeriodItem, { nullable: true })
    @IsObject()
    readonly price?: CollectionStatDataPeriodItem;

    @Field(() => Float, { nullable: true })
    @IsNumber()
    readonly supply?: number;

    @Field(() => Float, { nullable: true })
    @IsNumber()
    readonly floorPrice?: number;

    @Field(() => Float, { description: 'The collection net Gross from open sea', nullable: true })
    @IsNumber()
    readonly netGrossEarning?: number;

    @Field(() => CollectionStatDataPaymentToken, { nullable: true })
    @IsObject()
    readonly paymentToken?: CollectionStatDataPaymentToken;
}

@ObjectType('CollectionStat')
export class CollectionStat {
    @Field(() => String)
    @IsString()
    readonly source: string;

    @Field(() => CollectionStatData)
    @IsObject()
    readonly data: CollectionStatData;
}

export enum CollectionActivityType {
    Mint = 'Mint',
    Transfer = 'Transfer',
    Burn = 'Burn',
}

registerEnumType(CollectionActivityType, { name: 'CollectionActivityType' });

@ObjectType('CollectionActivities')
export class CollectionActivities {
    @Field(() => Int)
    @IsNumber()
    readonly total: number;

    @Field(() => [CollectionActivityData])
    @IsArray()
    readonly data: CollectionActivityData[];
}

@ObjectType('SecondarySale')
export class SecondarySale {
    @Field(() => Number)
    @IsNumber()
    public total: number;
}

@ObjectType('CollectionActivityData')
export class CollectionActivityData extends OmitType(Asset721, [], ObjectType) {
    @IsObject()
    @Field(() => Tier, { description: 'The tier of the activity data.', nullable: true })
    readonly tier: Tier;

    @IsEnum(CollectionActivityType)
    @Field(() => CollectionActivityType, { description: 'The activity type for collection.' })
    readonly type: CollectionActivityType;

    @IsObject()
    @Field(() => MintSaleTransaction, { description: 'The transaction of the activity data.' })
    readonly transaction: MintSaleTransaction;
}

@ObjectType('LandingPageCollection')
export class LandingPageCollection {
    @Field(() => Int)
    @IsNumber()
    readonly total: number;

    @Field(() => [Collection])
    @IsArray()
    readonly data: Collection[];
}

@ObjectType('CollectionPaginated')
export class CollectionPaginated extends Paginated(Collection) {}

@ObjectType('CollectionSold')
export class CollectionSold extends PickType(
    MintSaleTransaction,
    [
        'id',
        'address',
        'tokenAddress',
        'paymentToken',
        'tokenId',
        'price',
        'txTime',
        'txHash',
        'chainId',
        'createdAt',
        'sender',
        'recipient',
    ] as const,
    ObjectType
) {
    @Field(() => Tier)
    @IsObject()
    readonly tier?: Tier;
}

@ObjectType('CollectionSoldPaginated')
export class CollectionSoldPaginated extends Paginated(CollectionSold) {}

@ObjectType('Volume')
export class Volume {
    @IsString()
    @IsOptional()
    @Field({ description: 'Profits in payment token', nullable: true })
    readonly inPaymentToken?: string;

    @IsString()
    @IsOptional()
    @Field({ description: 'Profits converted to USDC', nullable: true })
    readonly inUSDC?: string;
}

@ObjectType('SevenDayVolume')
export class SevenDayVolume extends Volume {}

@ObjectType('GrossEarnings')
export class GrossEarnings extends Volume {}
