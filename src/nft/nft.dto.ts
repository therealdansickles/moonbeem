import { IsObject, IsOptional, IsString } from 'class-validator';
import { GraphQLJSONObject } from 'graphql-type-json';

import { Field, InputType, ObjectType, PickType } from '@nestjs/graphql';

import { Collection } from '../collection/collection.dto';
import { Metadata, MetadataProperties } from '../metadata/metadata.dto';
import { Tier } from '../tier/tier.dto';

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
    @Field(() => Tier, { description: 'The tier of the NFT belongs to.' } )
    readonly tier?: Tier;

    @IsString()
    @Field({ description: 'The tokenId of the NFT belongs to.' })
    readonly tokenId: string;

    @IsString()
    @IsOptional()
    @Field({ nullable: true, description: 'The owner address of the NFT.' })
    public owner?: string;

    @IsObject()
    @Field(() => GraphQLJSONObject, { description:  'The properties of the NFT.', nullable: true })
    readonly properties: MetadataProperties;

    @IsObject()
    @Field(() => GraphQLJSONObject, { description: 'The full rendered metadata of the NFT', nullable: true })
    public metadata?: Metadata;
}

@ObjectType('NftPropertyOverview')
export class NftPropertyOverview {
    @IsString()
    @IsOptional()
    @Field({ nullable: true,  description: 'The max value of the property appears in a collection.' })
    readonly max?: string;

    @IsString()
    @IsOptional()
    @Field({ nullable: true,  description: 'The min value of the property appears in a collection.' })
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
    @Field({ description: 'The tier of the NFT belongs to.' } )
    readonly tierId: string;
}