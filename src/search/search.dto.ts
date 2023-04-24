import { ArgsType, Field, InputType, Int, ObjectType } from '@nestjs/graphql';
import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsEthereumAddress, IsInt, IsNumber, IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';
import { EthereumAddress } from '../lib/scalars/eth.scalar';

@ObjectType()
export class CollectionSearchResult {
    @Field({ description: 'The collection name' })
    @ApiProperty()
    @IsString()
    name: string;

    @Field({
        nullable: true,
        description: 'The image url for the avatar of the collection. This is the profile picture.',
    })
    @ApiProperty()
    @IsString()
    @IsOptional()
    image?: string;

    @Field(() => EthereumAddress, {
        description: "The address of the collection, e.g. '0x6bf9ec331e083627b0f48332ece2d99a7eb7fb0c'",
    })
    @ApiProperty()
    @IsEthereumAddress()
    address: string;

    @Field((type) => Int!, { description: 'The chainId of the collection.' })
    @ApiProperty()
    @IsNumber()
    chainId: number;

    @Field({ description: 'The total number of items in this collection' })
    @ApiProperty()
    @IsNumber()
    @IsOptional()
    itemsCount: number;
}

@ObjectType()
export class CollectionSearchResults {
    @Field(() => [CollectionSearchResult], { description: 'An array of collections that fits the search query' })
    @ApiProperty({
        type: [CollectionSearchResult],
    })
    @IsOptional()
    data: CollectionSearchResult[];

    @ApiProperty()
    @IsBoolean()
    @Field({ description: 'A boolean indicating wether this is the last page of the pagination' })
    isLastPage: boolean;

    @ApiProperty()
    @IsNumber()
    @Type(() => Number)
    @Field({ description: 'The total number of items that fits the search query' })
    total: number;
}

@ObjectType()
export class UserSearchResult {
    @Field({ description: "The user's name" })
    @ApiProperty()
    @IsString()
    name: string;

    @Field({ nullable: true, description: "The user's avatar" })
    @ApiProperty()
    @IsString()
    @IsOptional()
    avatar?: string;

    @Field(() => EthereumAddress, { description: "The user's wallet address" })
    @ApiProperty()
    @IsEthereumAddress()
    address: string;
}

@ObjectType()
export class UserSearchResults {
    @Field(() => [UserSearchResult], { description: 'An array of users that fits the search query' })
    @ApiProperty({
        type: [UserSearchResult],
    })
    @IsOptional()
    data: UserSearchResult[];

    @ApiProperty()
    @IsBoolean()
    @Field({ description: 'A boolean indicating wether this is the last page of the pagination' })
    isLastPage: boolean;

    @Field({ description: 'The total number of items that fits the search query' })
    @ApiProperty()
    @IsNumber()
    @Type(() => Number)
    total: number;
}

@ObjectType()
export class GlobalSearchResult {
    @Field(() => CollectionSearchResults, {
        description: 'The data object of the collections that fit the search query',
    })
    @ApiProperty({
        type: [CollectionSearchResults],
    })
    collections: CollectionSearchResults;

    @Field(() => UserSearchResults, { description: 'The data object of the users that fit the search query' })
    @ApiProperty({
        type: [UserSearchResults],
    })
    users: UserSearchResults;
}

@InputType('GloablSearchInput')
export class GloablSearchInput {
    @Field()
    @ApiProperty()
    @IsString()
    searchTerm: string;

    @Field()
    @ApiProperty()
    @IsInt()
    @Type(() => Number)
    @IsOptional()
    page?: number;

    @Field()
    @ApiProperty()
    @IsInt()
    @Type(() => Number)
    @IsOptional()
    pageSize?: number;
}
