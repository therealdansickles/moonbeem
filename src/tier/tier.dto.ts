import { Field, Int, ObjectType, InputType, OmitType } from '@nestjs/graphql';
import { IsNumber, IsString, IsNumberString, IsObject, IsOptional, IsArray } from 'class-validator';
import { GraphQLJSONObject } from 'graphql-type-json';
import { Collection, CollectionInput } from '../collection/collection.dto';
import Paginated from '../lib/pagination/pagination.model';
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
export class MetadataTrigger {
    @IsString()
    @Field({ description: 'Trigger type.' })
    readonly type: string;

    @IsString()
    @Field({ description: 'Trigger value.' })
    readonly value: string;
}

@ObjectType()
export class MetadataRuleUpdate {
    @IsString()
    @Field({ description: 'The check property of the rule.' })
    readonly property: string;

    @Field(() => String, { description: 'How to deal with the property.' })
    readonly value: string | number;
}

@ObjectType()
export class MetadataRule {
    @IsString()
    @Field({ description: 'The property of the rule.' })
    readonly property: string;

    @IsString()
    @Field({ description: 'The rule detail of the rule.' })
    readonly rule: string;

    @Field(() => String, { description: 'The real value of the rule.' })
    readonly value: string | number;

    @IsArray()
    @Field(() => [MetadataRuleUpdate], { description: 'The update detail of the rule.' })
    readonly update: MetadataRuleUpdate[];
}

@ObjectType()
export class MetadataCondition {
    @IsString()
    @IsOptional()
    @Field({ description: 'The condition operator.' })
    readonly operator?: string;

    @IsArray()
    @Field(() => [MetadataRule], { description: 'The condition rules.' })
    readonly rules: MetadataRule[];

    @IsObject()
    @Field(() => MetadataTrigger, { description: 'The condition trigger.' })
    readonly trigger: MetadataTrigger;
}

@ObjectType()
export class MetadataProperty {
    @IsString()
    @Field({ description: 'The name of the property.' })
    readonly name: string;

    @IsString()
    @Field({ description: 'The type of the property.' })
    readonly type: string;

    @IsString()
    @IsOptional()
    @Field({ nullable: true, description: 'The display value of the property.' })
    readonly display_value?: string;

    @Field(() => String, { description: 'The value of the property.' })
    readonly value: string | number;
}

@ObjectType()
export class MetadataOutput {
    @IsArray()
    @Field(() => [String], { description: 'The plugin of the metadata' })
    readonly uses: string[];

    @IsString()
    @IsOptional()
    @Field({ description: 'The name of the metadata.' })
    readonly name?: string;

    @IsString()
    @IsOptional()
    @Field({ description: 'The type of the metadata.' })
    readonly type?: string;

    @IsString()
    @IsOptional()
    @Field({ nullable: true, description: 'The external_url of the metadata.' })
    readonly external_url?: string;

    @IsString()
    @IsOptional()
    @Field({ nullable: true, description: 'The image of the metadata.' })
    readonly image?: string;

    @IsString()
    @IsOptional()
    @Field({ nullable: true, description: 'The image_url of the metadata.' })
    readonly image_url?: string;

    @IsObject()
    @IsOptional()
    @Field(() => MetadataCondition, { nullable: true, description: 'The conditions of the metadata.' })
    readonly conditions?: MetadataCondition;

    @IsObject()
    @Field(() => GraphQLJSONObject, { description: 'The properties of the metadata.' })
    readonly properties: { [key: string]: MetadataProperty };
}

@ObjectType()
export class MetadataInput extends OmitType(MetadataOutput, [], InputType) {}

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

    @Field(() => GraphQLJSONObject, { nullable: true, description: 'The full metadata of the tier.' })
    @IsObject()
    readonly metadata: MetadataOutput;

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

    @Field(() => GraphQLJSONObject, { nullable: true, description: 'The full metadata of the tier.' })
    @IsObject()
    readonly metadata: MetadataInput;

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

    @Field(() => GraphQLJSONObject, { nullable: true, description: 'The full metadata of the tier.' })
    @IsObject()
    readonly metadata?: MetadataInput;

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

@ObjectType('TierSearchPaginated')
export class TierSearchPaginated extends Paginated(Tier) {}

@InputType('MetadataPropertyInput')
export class MetadataPropertyInput extends OmitType(MetadataProperty, ['type', 'display_value'], InputType) {}

@InputType('TierSearchBarInput')
export class TierSearchInput {
    @IsString()
    @Field({ description: 'The id of the collection.', nullable: true })
    @IsOptional()
    readonly collectionId?: string;

    @IsString()
    @Field({ description: 'The address of the collection.', nullable: true })
    @IsOptional()
    readonly collectionAddress?: string;

    @IsString()
    @Field({ nullable: true, description: 'The keyword for search tier.' })
    @IsOptional()
    readonly keyword?: string;

    @IsArray()
    @Field(() => [MetadataPropertyInput], { nullable: true, description: 'The properties of the tier.' })
    @IsOptional()
    readonly properties?: MetadataPropertyInput[];

    @IsArray()
    @Field(() => [String], { nullable: true, description: 'The plugins of the tier.' })
    @IsOptional()
    readonly plugins: string[];

    @IsArray()
    @Field(() => [String], { nullable: true, description: 'The upgrade properties of the tier.' })
    @IsOptional()
    readonly upgrades: string[];
}

export class IOverview {
    attributes: IAttributeOverview;
    upgrades: IUpgradeOverview;
    plugins: IPluginOverview;
}

export class IAttributeOverview {
    [key: string]: IValueCount;
}

export class IValueCount {
    [key: string]: number;
}

export class IUpgradeOverview extends IValueCount {}
export class IPluginOverview extends IValueCount {}
