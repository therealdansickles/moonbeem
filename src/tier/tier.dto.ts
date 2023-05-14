import { ArgsType, Field, Int, ObjectType, InputType, ID, createUnionType } from '@nestjs/graphql';
import {
    IsNumber,
    IsString,
    IsNumberString,
    IsDateString,
    IsUrl,
    ValidateIf,
    IsObject,
    IsOptional,
    IsArray,
} from 'class-validator';
import { Type } from 'class-transformer';
import { Collection, CollectionInput } from '../collection/collection.dto';
import { Coin } from '../sync-chain/coin/coin.dto';
import { Any } from 'typeorm';
import { GraphQLJSONObject } from 'graphql-type-json';

@InputType()
export class Attribute {
    @IsString()
    @Field({ description: 'The display type for the attribute', nullable: true })
    @IsOptional()
    display_type?: string;

    @IsString()
    @Field({ description: 'The trait type of the attribute' })
    trait_type: string;

    @IsString()
    @Field({ description: 'The value of the attribute' })
    value: string;
}

@InputType()
export class Plugin {
    @IsString()
    @Field({ description: 'The type for the plugin. can be `github`, `vibe` etc.' })
    type: string;

    @IsString()
    @Field({ description: 'The path for the plugin.' })
    path: string;

    @Field((type) => GraphQLJSONObject, { description: 'The path for the plugin.', nullable: true })
    @IsOptional()
    config?: { [key: string]: any };
}

@ObjectType()
export class Profit {
    @IsString()
    @IsOptional()
    @Field({ description: 'Profits in payment token', nullable: true })
    readonly inPaymentToken?: string;

    @IsString()
    @IsOptional()
    @Field({ description: 'Profits converted to USDC', nullable: true })
    readonly inUSDC?: string;
}

@ObjectType()
export class Tier {
    @IsString()
    @Field({ description: 'The id of the tier.' })
    readonly id: string;

    @IsNumber()
    @Field((type) => Int, { description: 'The total number of mints for this tier.' })
    readonly totalMints: number;

    @IsNumberString()
    @Field({ description: 'The price of the NFTs in this tier.', nullable: true })
    readonly price?: string;

    @IsNumber()
    @Field((type) => Int, { description: 'The tier id/index of the NFTs in this tier.' })
    readonly tierId: number;

    @IsString()
    @Field({ description: 'The name of the tier.', nullable: true })
    readonly name?: string;

    @Field(() => Collection, { description: 'The collection associated with this tier.' })
    readonly collection: Collection;

    @IsString()
    @Field({ description: 'The description of the tier.', nullable: true })
    readonly description?: string;

    @IsString()
    @Field({ description: 'This is the URL to the image of the tier.', nullable: true })
    @IsOptional()
    readonly image?: string;

    @IsString()
    @Field({
        description:
            "This is the URL that will appear with the asset's image and allow users to leave the marketplace and view the tier on your site.",
        nullable: true,
    })
    @IsOptional()
    readonly externalUrl?: string;

    @IsString()
    @Field({ description: 'This is the URL to the animation of the tier.', nullable: true })
    @IsOptional()
    readonly animationUrl?: string;

    @IsString()
    @Field({ description: 'This merekleRoot of tier', nullable: true })
    @IsOptional()
    readonly merkleRoot?: string;

    @IsString()
    @Field({ description: 'A JSON object containing the attributes of the tier.', nullable: true })
    @IsOptional()
    readonly attributes?: string;

    @IsString()
    @Field({ description: 'A JSON object containing the conditions of the tier.', nullable: true })
    @IsOptional()
    readonly conditions?: string;

    @IsString()
    @Field({
        description: 'A JSON object containing the plugins of the tier.',
        nullable: true,
    })
    @IsOptional()
    readonly plugins?: string;

    @Field(() => Coin, { description: 'The tier coin', nullable: true })
    @IsOptional()
    readonly coin?: Coin;
}

@InputType()
export class CreateTierInput {
    @IsObject()
    @Field(() => CollectionInput, { description: 'The collection associated with this tier.' })
    readonly collection: CollectionInput;

    @IsNumber()
    @Field((type) => Int, { description: 'The total number of mints for this tier.' })
    readonly totalMints: number;

    @Field({ description: 'The price of the NFTs in this tier.', nullable: true })
    readonly price?: string;

    @IsNumber()
    @Field((type) => Int, { description: 'The tier id/index of the NFTs in this tier.' })
    readonly tierId: number;

    @IsString()
    @Field({ description: 'The name of the tier.', nullable: true })
    readonly name?: string;

    @Field({ description: 'the tier selected coin id', nullable: true })
    @IsString()
    readonly paymentTokenAddress?: string;

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

    @Field((type) => [Attribute], { description: 'The tier attributes', nullable: true })
    @IsArray()
    @IsOptional()
    readonly attributes?: Attribute[];

    @Field((type) => [GraphQLJSONObject], { description: 'The tier conditions', nullable: true })
    @IsOptional()
    @IsArray()
    readonly conditions?: { [key: string]: any }[];

    @IsArray()
    @Field((type) => [GraphQLJSONObject], {
        description: 'A JSON object containing the plugins of the tier.',
        nullable: true,
    })
    @IsOptional()
    readonly plugins?: Plugin[];

    @IsString()
    @Field({ nullable: true, description: 'This merekleRoot of tier.' })
    @IsOptional()
    readonly merkleRoot?: string;
}

@InputType()
export class UpdateTierInput {
    @IsString()
    @Field({ description: 'The id of the tier.' })
    readonly id: string;

    @IsNumber()
    @Field((type) => Int, { nullable: true, description: 'The total number of mints for this tier.' })
    readonly totalMints?: number;

    @IsNumber()
    @Field({ description: 'The price of the NFTs in this tier.', nullable: true })
    readonly price?: string;

    @IsNumber()
    @Field((type) => Int, { nullable: true, description: 'The tier id/index of the NFTs in this tier.' })
    readonly tierId?: number;

    @IsString()
    @Field({ nullable: true, description: 'The name of the tier.' })
    readonly name?: string;

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

    @Field((type) => [Attribute], { description: 'The tier attributes', nullable: true })
    @IsArray()
    @IsOptional()
    readonly attributes?: Attribute[];

    @Field((type) => [GraphQLJSONObject], { description: 'The tier conditions', nullable: true })
    @IsOptional()
    @IsArray()
    readonly conditions?: (typeof GraphQLJSONObject)[];

    @IsArray()
    @Field((type) => [GraphQLJSONObject], {
        description: 'A JSON object containing the plugins of the tier.',
        nullable: true,
    })
    @IsOptional()
    readonly plugins?: Plugin[];

    @IsString()
    @Field({ nullable: true, description: 'This merekleRoot of tier.' })
    @IsOptional()
    readonly merkleRoot?: string;
}

@InputType()
export class DeleteTierInput {
    @IsString()
    @Field({ description: 'The id for a tier.' })
    readonly id: string;
}
