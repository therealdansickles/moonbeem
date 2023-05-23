import {
    ArgsType,
    Field,
    Int,
    ObjectType,
    InputType,
    registerEnumType,
    ID,
    PartialType,
    OmitType,
    PickType,
} from '@nestjs/graphql';
import { IsNumber, IsString, IsDateString, IsUrl, IsOptional, IsArray, IsObject } from 'class-validator';
import { Type } from 'class-transformer';
import { CollectionKind } from './collection.entity';
import { AttributeInput, Tier, PluginInput, ConditionInput } from '../tier/tier.dto';
import { Organization, OrganizationInput } from '../organization/organization.dto';
import { CollaborationInput } from '../collaboration/collaboration.dto';
import { MintSaleContract } from '../sync-chain/mint-sale-contract/mint-sale-contract.dto';
import { Wallet, WalletInput } from '../wallet/wallet.dto';
import { Collaboration } from '../collaboration/collaboration.dto';

registerEnumType(CollectionKind, { name: 'CollectionKind' });

@ObjectType('Collection')
export class Collection {
    @IsString()
    @Field({ description: 'The ID for a collection' })
    readonly id: string;

    @IsString()
    @Field({ description: 'The unique URL-friendly identifier for a collection.' })
    readonly name: string;

    @Field((type) => CollectionKind, { description: 'The type of collection this is.' })
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

    @IsUrl()
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
    @Field((type) => [String], { description: 'The tags associated with this organization.', nullable: true })
    readonly tags?: string[];

    @Field((type) => [Tier], { description: 'The collection tiers', nullable: true })
    @IsArray()
    readonly tiers?: Tier[];

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
    @Field((type) => MintSaleContract, { description: 'The collection contract', nullable: true })
    readonly contract?: MintSaleContract;

    @IsObject()
    @Field((type) => Collaboration, { description: 'The collaboration of the collection.', nullable: true })
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
    @Field((type) => OrganizationInput, { description: 'The organization that owns the collection.' })
    readonly organization: OrganizationInput;

    @IsObject()
    @Field((type) => CollaborationInput, { description: 'The collaboration of the collection.', nullable: true })
    @IsOptional()
    readonly collaboration?: CollaborationInput;

    @IsArray()
    @Field((type) => [CreateTierInCollectionInput], { description: 'This tiers for collection', nullable: true })
    @IsOptional()
    readonly tiers?: CreateTierInCollectionInput[];
}

@InputType()
export class UpdateCollectionInput extends OmitType(CreateCollectionInput, ['organization', 'collaboration', 'tiers']) {
    @IsString()
    @Field({ description: 'The id for a collection.' })
    readonly id: string;
}

@InputType()
export class CollectionInput extends PickType(Collection, ['id'], InputType) {}

@InputType('CreateTierInCollectionInput')
export class CreateTierInCollectionInput {
    @IsNumber()
    @Field((type) => Int, { description: 'The total number of mints for this tier.' })
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

    @Field((type) => [AttributeInput], { description: 'The tier attributes', nullable: true })
    @IsArray()
    @IsOptional()
    readonly attributes?: AttributeInput[];

    @Field((type) => [ConditionInput], { description: 'The tier attributes', nullable: true })
    @IsArray()
    @IsOptional()
    readonly conditions?: ConditionInput[];

    @Field((type) => [PluginInput], { description: 'The tier attributes', nullable: true })
    @IsArray()
    @IsOptional()
    readonly plugins?: PluginInput[];

    @IsString()
    @Field({ nullable: true, description: 'This merekleRoot of tier.' })
    @IsOptional()
    readonly merkleRoot?: string;

    @IsString()
    @Field({ nullable: true, description: 'The price of NFTs in this tier.' })
    @IsOptional()
    readonly price?: string;
}
