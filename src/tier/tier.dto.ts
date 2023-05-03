import { ArgsType, Field, Int, ObjectType, InputType, ID } from '@nestjs/graphql';
import { IsNumber, IsString, IsNumberString, IsDateString, IsUrl, ValidateIf, IsObject, IsOptional, IsArray } from 'class-validator';
import { Type } from 'class-transformer';
import { Collection, CollectionInput } from '../collection/collection.dto';
import { Coin } from '../sync-chain/coin/coin.dto';

@InputType()
export class Attribute {
    @IsString()
    @Field({ description: 'The display type for the attribute', nullable: true })
    @IsOptional()
    display_type?: string;

    @IsString()
    @Field({ description: 'The trait type of the attribute' })
    trait_type: string;

    @Field({ description: 'The value of the attribute' })
    @IsString()
    value: string;
}

@ObjectType()
export class Tier {
    @IsString()
    @Field({ description: 'The id of the tier.' })
    readonly id: string;

    @IsNumber()
    @Field({ description: 'The total number of mints for this tier.', nullable: true })
    readonly totalMints?: number;

    @IsNumberString()
    @Field({ description: 'The price of the NFTs in this tier.', nullable: true })
    readonly price?: string;

    @IsNumber()
    @Field({ description: 'The tier id/index of the NFTs in this tier.', nullable: true })
    readonly tierId?: number;

    @Field({ description: 'The starting id/index of the NFTs in this tier.', nullable: true })
    beginId?: number;

    @Field({ description: 'The ending id/index of the NFTs in this tier.', nullable: true })
    endId?: number;

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
    @Field({ description: 'The total number of mints for this tier.', nullable: true })
    readonly totalMints?: number;

    @IsNumber()
    @Field({ description: 'The price of the NFTs in this tier.', nullable: true })
    readonly price?: string;

    @IsNumber()
    @Field({ nullable: true, description: 'The tier id/index of the NFTs in this tier.' })
    readonly tierId?: number;

    @Field({ nullable: true, description: 'The starting id/index of the NFTs in this tier.' })
    beginId?: number;

    @Field({ nullable: true, description: 'The ending id/index of the NFTs in this tier.' })
    endId?: number;

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
    readonly attributes?: Attribute[];

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
    @Field({ nullable: true, description: 'The total number of mints for this tier.' })
    readonly totalMints?: number;

    @IsNumber()
    @Field({ description: 'The price of the NFTs in this tier.', nullable: true })
    readonly price?: string;

    @IsNumber()
    @Field({ nullable: true, description: 'The tier id/index of the NFTs in this tier.' })
    readonly tierId?: number;

    @Field({ nullable: true, description: 'The starting id/index of the NFTs in this tier.' })
    readonly beginId?: number;

    @Field({ nullable: true, description: 'The ending id/index of the NFTs in this tier.' })
    readonly endId?: number;

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

    @IsString()
    @Field({ nullable: true, description: 'A JSON object containing the attributes of the tier.' })
    @IsOptional()
    readonly attributes?: string;

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
