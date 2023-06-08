import { Field, Int, ObjectType, InputType, OmitType } from '@nestjs/graphql';
import { IsNumber, IsString, IsNumberString, IsObject, IsOptional, IsArray } from 'class-validator';
import { Collection, CollectionInput } from '../collection/collection.dto';
import { Coin } from '../sync-chain/coin/coin.dto';

@ObjectType('AttributeOutput')
export class AttributeOutput {
    @IsString()
    @Field({ description: 'The trait type of the attribute' })
    readonly trait_type: string;

    @IsString()
    @Field({ description: 'The value of the attribute' })
    readonly value: string;
}
@InputType('AttributeInput')
export class AttributeInput extends OmitType(AttributeOutput, [], InputType) {}

@ObjectType('ConditionOutput')
export class ConditionOutput {
    @IsString()
    @Field({ description: 'The trait type of the condition' })
    readonly trait_type: string;

    @IsObject()
    @Field(() => AttributeOutput, { description: 'The rule of the condition' })
    readonly rules: AttributeOutput;

    @IsObject()
    @Field({ description: 'The update of the condition' })
    readonly update: AttributeOutput;
}
@InputType('ConditionInput')
export class ConditionInput extends OmitType(ConditionOutput, ['rules', 'update'], InputType) {
    @IsObject()
    @Field(() => AttributeInput, { description: 'The rule of the condition' })
    readonly rules: AttributeInput;

    @IsObject()
    @Field(() => AttributeInput, { description: 'The update of the condition' })
    readonly update: AttributeInput;
}

@ObjectType()
export class PluginOutput {
    @IsString()
    @Field({ description: 'The type for the plugin. can be `github`, `vibe` etc.' })
    readonly type: string;

    @IsString()
    @Field({ description: 'The path for the plugin.' })
    readonly path: string;
}
@InputType()
export class PluginInput extends OmitType(PluginOutput, [], InputType) {}

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
    @Field(() => Int, { description: 'The total number of mints for this tier.' })
    readonly totalMints: number;

    @IsNumberString()
    @Field({ description: 'The price of the NFTs in this tier.', nullable: true })
    readonly price?: string;

    @IsNumber()
    @Field(() => Int, { description: 'The tier id/index of the NFTs in this tier.' })
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

    @Field(() => [AttributeOutput], {
        description: 'A JSON object containing the attributes of the tier.',
        nullable: true,
    })
    @IsArray()
    readonly attributes?: AttributeOutput[];

    @Field(() => [ConditionOutput], {
        description: 'A JSON object containing the conditions of the tier.',
        nullable: true,
    })
    @IsArray()
    @IsOptional()
    readonly conditions?: ConditionOutput[];

    @Field(() => [PluginOutput], {
        description: 'A JSON object containing the plugins of the tier.',
        nullable: true,
    })
    @IsArray()
    @IsOptional()
    readonly plugins?: PluginOutput[];

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
    @Field(() => Int, { description: 'The total number of mints for this tier.' })
    readonly totalMints: number;

    @IsNumberString()
    @Field({ description: 'The price of the NFTs in this tier.', nullable: true })
    readonly price?: string;

    @IsNumber()
    @Field(() => Int, { description: 'The tier id/index of the NFTs in this tier.' })
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

    @Field(() => [AttributeInput], { description: 'The tier attributes', nullable: true })
    @IsArray()
    readonly attributes?: AttributeInput[];

    @Field(() => [ConditionInput], { description: 'The tier conditions', nullable: true })
    @IsOptional()
    @IsArray()
    readonly conditions?: ConditionInput[];

    @IsArray()
    @Field(() => [PluginInput], {
        description: 'A JSON object containing the plugins of the tier.',
        nullable: true,
    })
    @IsOptional()
    readonly plugins?: PluginInput[];

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
    @Field(() => Int, { nullable: true, description: 'The total number of mints for this tier.' })
    readonly totalMints?: number;

    @IsNumberString()
    @Field({ description: 'The price of the NFTs in this tier.', nullable: true })
    readonly price?: string;

    @IsNumber()
    @Field(() => Int, { nullable: true, description: 'The tier id/index of the NFTs in this tier.' })
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

    @Field(() => [AttributeInput], { description: 'The tier attributes', nullable: true })
    @IsArray()
    @IsOptional()
    readonly attributes?: AttributeInput[];

    @Field(() => [ConditionInput], { description: 'The tier conditions', nullable: true })
    @IsOptional()
    @IsArray()
    readonly conditions?: ConditionInput[];

    @IsArray()
    @Field(() => [PluginInput], {
        description: 'A JSON object containing the plugins of the tier.',
        nullable: true,
    })
    @IsOptional()
    readonly plugins?: PluginInput[];

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

@ObjectType()
export class BasicPriceInfo {
    @Field()
    @IsNumberString()
    readonly price: string;

    @Field(() => String)
    @IsString()
    readonly token: string;

    @Field(() => Int)
    @IsNumber()
    readonly chainId: number;
}
