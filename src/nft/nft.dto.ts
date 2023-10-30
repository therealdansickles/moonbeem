import { IsArray, IsNumber, IsObject, IsOptional, IsString } from 'class-validator';
import { GraphQLJSONObject } from 'graphql-type-json';

import { Field, InputType, ObjectType, PickType } from '@nestjs/graphql';

import { Collection } from '../collection/collection.dto';
import { Metadata, MetadataProperties } from '../metadata/metadata.dto';
import { Tier } from '../tier/tier.dto';
import { InstalledPluginInfo } from '../collectionPlugin/collectionPlugin.dto';
import Paginated, { PaginationInput } from '../pagination/pagination.dto';

@ObjectType('Nft')
export class Nft {
    @IsString()
    @Field({ description: 'The ID for a collection' })
    readonly id: string;

    @IsObject()
    @Field(() => Collection, { description: 'The collection of the NFT belongs to.' })
    readonly collection: Collection;

    @IsObject()
    @IsOptional()
    @Field(() => Tier, { description: 'The tier of the NFT belongs to.' })
    readonly tier?: Tier;

    @IsString()
    @Field({ description: 'The tokenId of the NFT belongs to.' })
    readonly tokenId: string;

    @IsString()
    @IsOptional()
    @Field({ nullable: true, description: 'The owner address of the NFT.' })
    public owner?: string;

    @IsString()
    @IsOptional()
    @Field({ nullable: true, description: 'The ownerAddress of the NFT.' })
    public ownerAddress?: string;

    @IsObject()
    @Field(() => GraphQLJSONObject, { description: 'The properties of the NFT.', nullable: true })
    readonly properties: MetadataProperties;

    @IsObject()
    @Field(() => GraphQLJSONObject, { description: 'The full rendered metadata of the NFT', nullable: true })
    public metadata?: Metadata;

    @IsObject()
    @IsOptional()
    @Field(() => [InstalledPluginInfo], { description: 'The installed plugin info', nullable: true })
    public pluginsInstalled?: InstalledPluginInfo[];
}

@ObjectType('NftPaginated')
export class NftPaginated extends Paginated(Nft) {}

@InputType('NftPropertiesSearchInput')
export class NftPropertiesSearchInput {
    @IsString()
    @Field({ description: 'The property name for searching' })
    readonly name: string;

    @IsString()
    @IsOptional()
    @Field({ description: 'The property value for searching', nullable: true })
    readonly value?: string;

    @IsNumber()
    @IsOptional()
    @Field({ description: 'The min value for searching', nullable: true })
    readonly min?: number;

    @IsNumber()
    @IsOptional()
    @Field({ description: 'The max value for searching', nullable: true })
    readonly max?: number;
}

@ObjectType('NftPropertyOverview')
export class NftPropertyOverview {
    @IsString()
    @IsOptional()
    @Field({ nullable: true, description: 'The max value of the property appears in a collection.' })
    readonly max?: string;

    @IsString()
    @IsOptional()
    @Field({ nullable: true, description: 'The min value of the property appears in a collection.' })
    readonly min?: string;

    @IsString()
    @IsOptional()
    @Field({ nullable: true, description: 'The avg value of the property appears in a collection.' })
    readonly avg?: string;
}

@InputType()
export class CreateOrUpdateNftInput extends PickType(Nft, ['tokenId', 'properties'] as const, InputType) {
    @IsString()
    @Field({ description: 'The collection of the NFT belongs to.' })
    readonly collectionId: string;

    @IsString()
    @Field({ description: 'The tier of the NFT belongs to.' })
    readonly tierId: string;
}

@InputType()
export class GetNftsPaginatedInput {
    @IsString()
    @IsOptional()
    @Field({ description: 'The collection of the NFT belongs to.', nullable: true })
    readonly collectionId?: string;

    @IsString()
    @IsOptional()
    @Field({ description: 'The tier of the NFT belongs to.', nullable: true })
    readonly tierId?: string;

    @IsArray()
    @IsOptional()
    @Field(() => [String], { description: 'The tokenIds of the NFT to search.', nullable: true })
    readonly tokenIds?: string[];

    @IsString()
    @IsOptional()
    @Field({ description: 'The ownerAddress of the NFT.', nullable: true })
    readonly ownerAddress?: string;

    @IsObject()
    @IsOptional()
    @Field(() => [NftPropertiesSearchInput], { description: 'The properties of the NFT to search.', nullable: true })
    readonly properties?: NftPropertiesSearchInput[];

    @IsArray()
    @IsOptional()
    @Field(() => [String], { description: 'The plugins of the NFT.', nullable: true })
    readonly plugins?: string[];

    @IsObject()
    @IsOptional()
    @Field(() => PaginationInput, { description: 'The pagination of the NFT to search.', nullable: true })
    readonly pagination?: PaginationInput;
}
