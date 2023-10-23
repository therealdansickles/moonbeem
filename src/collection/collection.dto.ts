import { IsArray, IsDateString, IsEnum, IsNumber, IsObject, IsOptional, IsString, IsUrl, ValidateIf } from 'class-validator';
import { GraphQLJSONObject } from 'graphql-type-json';

import { Field, Float, InputType, Int, ObjectType, OmitType, PartialType, PickType, registerEnumType } from '@nestjs/graphql';

import { Collaboration, CollaborationInput } from '../collaboration/collaboration.dto';
import { Metadata } from '../metadata/metadata.dto';
import { Organization, OrganizationInput } from '../organization/organization.dto';
import Paginated from '../pagination/pagination.dto';
import { Asset721 } from '../sync-chain/asset721/asset721.dto';
import { MintSaleContract } from '../sync-chain/mint-sale-contract/mint-sale-contract.dto';
import { MintSaleTransaction } from '../sync-chain/mint-sale-transaction/mint-sale-transaction.dto';
import { Profit, Tier } from '../tier/tier.dto';
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

    @IsString()
    @Field({ description: 'The slug to use in the URL' })
    readonly slug: string;

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

    @Field({
        description: 'The token address of the collection',
        nullable: true,
    })
    @IsOptional()
    readonly tokenAddress?: string;

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
        description: "Temporary field for store collection name in Opensea, while we can't retrieve collection stat by address",
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

    @IsObject()
    @Field(() => Collection, { description: 'The parent collection', nullable: true })
    @IsOptional()
    readonly parent?: Collection;

    @IsArray()
    @Field(() => [Collection], { description: 'The children collections', nullable: true })
    readonly children?: Collection[];
}

@InputType()
export class CollectionInput extends PickType(Collection, ['id'], InputType) {
}

@InputType()
export class CreateCollectionInput extends OmitType(PartialType(Collection, InputType), [
    'id',
    'organization',
    'tiers',
    'contract',
    'creator',
    'collaboration',
    'parent',
    'children',
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

    @IsObject()
    @Field(() => CollectionInput, { description: 'The parent collection id of this collection', nullable: true })
    @IsOptional()
    readonly parent?: CollectionInput;
}

@InputType()
export class UpdateCollectionInput extends OmitType(CreateCollectionInput, ['organization', 'tiers']) {
    @IsString()
    @Field({ description: 'The id for a collection.' })
    readonly id: string;
}

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
    @Field({ nullable: true, description: 'This merkleRoot of tier.' })
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
    ObjectType,
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

    @Field(() => CollectionStatData, { nullable: true })
    @IsObject()
    readonly data: CollectionStatData;
}

export enum CollectionActivityType {
    Mint = 'Mint',
    Transfer = 'Transfer',
    Burn = 'Burn',
    Unknown = 'Unknown',
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

@ObjectType('CollectionAggregatedActivities')
export class CollectionAggregatedActivities {
    @Field(() => Int)
    @IsNumber()
    readonly total: number;

    @Field(() => [CollectionAggregatedActivityData])
    @IsArray()
    readonly data: CollectionAggregatedActivityData[];
}

@ObjectType('CollectionAggregatedActivityData')
export class CollectionAggregatedActivityData extends PickType(
    MintSaleTransaction,
    ['txHash', 'txTime', 'recipient', 'sender', 'paymentToken', 'chainId'],
    ObjectType,
) {
    @IsObject()
    @Field(() => Profit, { description: 'Total cost object for the aggregated transaction' })
    readonly cost: Profit;

    @IsEnum(CollectionActivityType)
    @Field(() => CollectionActivityType, { description: 'The activity type for the aggregated transaction.' })
    readonly type: CollectionActivityType;

    @IsArray()
    @Field(() => String, { description: 'The tokenId in the aggregated transaction.' })
    readonly tokenId: string;

    @IsObject()
    @Field(() => Tier, { nullable: true, description: 'The tier info for the aggregated transaction.' })
    readonly tier?: Tier;
}

@ObjectType('CollectionAggregatedActivities')
export class CollectionAggregatedActivityPaginated extends Paginated(CollectionAggregatedActivityData) {
}

@ObjectType('SecondarySale')
export class SecondarySale {
    @Field(() => Number)
    @IsNumber()
    public total: number;
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
export class CollectionPaginated extends Paginated(Collection) {
}

@ObjectType('CollectionSold')
export class CollectionSold extends PickType(
    MintSaleTransaction,
    ['id', 'address', 'tokenAddress', 'paymentToken', 'tokenId', 'price', 'txTime', 'txHash', 'chainId', 'createdAt', 'sender', 'recipient'] as const,
    ObjectType,
) {
    @Field(() => Tier)
    @IsObject()
    readonly tier?: Tier;
}

@ObjectType('CollectionSoldPaginated')
export class CollectionSoldPaginated extends Paginated(CollectionSold) {
}

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

    @IsString()
    @IsOptional()
    @Field({ nullable: true, description: 'payment token for volume.' })
    readonly paymentToken?: string;
}

@ObjectType('SevenDayVolume')
export class SevenDayVolume extends Volume {
}

@ObjectType('GrossEarnings')
export class GrossEarnings extends Volume {
}

@ObjectType('EarningChartVolume')
export class EarningChartVolume extends Volume {
}

@ObjectType('CollectionEarningsChart')
export class CollectionEarningsChart {
    @IsString()
    @Field({ description: 'Timing of the earnings chart.' })
    readonly time: string;

    @IsObject()
    @Field(() => EarningChartVolume, { description: 'Volume of the earnings chart' })
    readonly volume: EarningChartVolume;
}

@ObjectType('CollectionEarningsChartPaginated')
export class CollectionEarningsChartPaginated extends Paginated(CollectionEarningsChart) {
}

@ObjectType('AggregatedVolume')
export class AggregatedVolume {
    @IsNumber()
    @Field(() => Profit, { description: 'total volume in the aggregator' })
    readonly total: Profit;

    @IsNumber()
    @Field(() => Profit, { description: 'monthly volume in the aggregator' })
    readonly monthly: Profit;

    @IsNumber()
    @Field(() => Profit, { description: 'weekly volume in the aggregator' })
    readonly weekly: Profit;
}

@ObjectType('CollectionSoldAggregated')
export class CollectionSoldAggregated {
    @Field(() => Int)
    @IsNumber()
    readonly total: number;

    @Field(() => [CollectionSoldAggregatedData])
    @IsArray()
    readonly data: CollectionSoldAggregatedData[];
}

@ObjectType('CollectionSoldAggregatedData')
export class CollectionSoldAggregatedData extends PickType(
    MintSaleTransaction,
    ['txHash', 'txTime', 'recipient', 'sender', 'paymentToken', 'chainId'],
    ObjectType,
) {
    @IsString()
    @Field(() => Profit, { description: 'Total cost object for the aggregated transaction' })
    readonly cost: Profit;

    @IsArray()
    @Field(() => [String], { description: 'The tokenIds in the aggregated transaction.' })
    readonly tokenIds: Array<string>;

    @IsObject()
    @Field(() => Tier, { nullable: true, description: 'The tier info for the aggregated transaction.' })
    readonly tier?: Tier;
}

@ObjectType('TokenIds')
export class TokenIds {
    @IsArray()
    @Field(() => [String], { description: 'The tokenIds' })
    readonly tokenIds: Array<string>;
}

@InputType()
export class PropertyFilter {
    @IsString()
    @Field({ description: 'The property name' })
    readonly name: string;

    @IsString()
    @Field(() => String, { nullable: true, description: 'The property value' })
    readonly value?: string;

    @IsString()
    @Field(() => [Int], { nullable: true, description: 'The range of the property' })
    readonly range?: number[];
}

@InputType()
export class SearchTokenIdsInput {
    @IsString()
    @Field(() => String)
    readonly collectionId: string;

    @IsArray()
    @Field(() => [PropertyFilter], { description: 'The static property filters' })
    readonly staticPropertyFilters: Array<PropertyFilter>;

    @IsArray()
    @Field(() => [PropertyFilter], { description: 'The dynamic property filters' })
    readonly dynamicPropertyFilters: Array<PropertyFilter>;
}

@ObjectType()
export class AttributesOverview {
    @IsArray()
    @Field(() => [AttributeOverview], { description: 'The static attribute details', nullable: 'itemsAndList' })
    readonly staticAttributes: AttributeOverview[];

    @IsArray()
    @Field(() => [AttributeOverview], { description: 'The dynamic attribute details.', nullable: 'itemsAndList' })
    readonly dynamicAttributes: AttributeOverview[];
}

@ObjectType()
export class UpgradeOverview {
    @IsString()
    @Field({ description: 'The name of the upgrade.' })
    readonly name: string;

    @IsNumber()
    @Field(() => Int, { description: 'The count of the nft has this upgrade.' })
    readonly count: number;
}

@ObjectType()
export class PluginOverview {
    @IsString()
    @Field({ description: 'The name of the collection plugin.' })
    readonly name: string;

    @IsNumber()
    @Field(() => Int, { description: 'The count of the nft has this plugin.' })
    readonly count: number;

    @IsString()
    @Field({ description: 'The name of the plugin installed.' })
    readonly pluginName: string;
}

@ObjectType()
export class MetadataOverview {
    @IsObject()
    @Field(() => AttributesOverview, { description: 'The attribute details' })
    readonly attributes: AttributesOverview;

    @IsArray()
    @Field(() => [UpgradeOverview], { description: 'The upgrade details' })
    readonly upgrades: UpgradeOverview[];

    @IsArray()
    @Field(() => [PluginOverview], { description: 'The plugin detail' })
    readonly plugins: PluginOverview[];
}

@ObjectType()
export class ValueCount {
    @IsString()
    @IsOptional()
    @Field(() => String, { description: 'The value of the property.' })
    readonly value?: string;

    @IsNumber()
    @Field(() => Int, { description: 'The count of the nft has this value.' })
    readonly count: number;

    @IsString()
    @Field(() => String, { description: 'Type type of the value.' })
    readonly type: string;
}

@ObjectType()
export class AttributeOverview {
    @IsString()
    @Field({ description: 'The name of the property.' })
    readonly name: string;

    @IsString()
    @Field({ description: 'The type of the property.' })
    readonly type: string;

    @IsArray()
    @Field(() => [ValueCount], { description: 'The value counts of the property.' })
    readonly valueCounts: ValueCount[];

    @IsString()
    @IsOptional()
    @Field({ nullable: true, description: 'The display value of the property.' })
    readonly displayValue?: string;

    @IsString()
    @IsOptional()
    @Field({ nullable: true, description: 'Mark if this property is upgradable.' })
    readonly class?: string;

    @IsNumber()
    @IsOptional()
    @Field({ nullable: true, description: 'The min value.' })
    readonly min?: number;

    @IsNumber()
    @IsOptional()
    @Field({ nullable: true, description: 'The max value.' })
    readonly max?: number;
}

@InputType()
export class MetadataOverviewInput {
    @IsString()
    @Field(() => String, { description: 'The collection id.', nullable: true })
    @IsOptional()
    readonly collectionId?: string;

    @IsString()
    @Field(() => String, { description: 'The collection slug.', nullable: true })
    @IsOptional()
    readonly collectionSlug?: string;

    @IsString()
    @Field(() => String, { description: 'The collection address.', nullable: true })
    @IsOptional()
    readonly collectionAddress?: string;
}

@InputType()
export class MigrateCollectionInput {
    @IsString()
    @Field(() => String, { description: 'The token address' })
    readonly tokenAddress: string;

    @IsNumber()
    @Field(() => Int, { description: 'The chain id' })
    readonly chainId: number;

    @IsString()
    @Field(() => String, { description: 'The organization id' })
    readonly organizationId: string;
}
