import { IsInt, IsObject, IsOptional, IsString } from 'class-validator';
import { GraphQLJSONObject } from 'graphql-type-json';

import { Field, InputType, ObjectType, PickType } from '@nestjs/graphql';

import { Collection } from '../collection/collection.dto';
import { MetadataProperties } from '../metadata/metadata.dto';
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

    @IsInt()
    @Field({ description: 'The tokenId of the NFT belongs to.' })
    readonly tokenId: number;

    @IsObject()
    @Field(() => GraphQLJSONObject, { description:  'The properties of the NFT.' })
    readonly properties: MetadataProperties;
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