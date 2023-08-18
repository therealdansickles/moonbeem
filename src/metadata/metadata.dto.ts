import { IsArray, IsNumber, IsObject, IsOptional, IsString } from 'class-validator';
import { GraphQLJSONObject } from 'graphql-type-json';

import { Field, InputType, ObjectType, OmitType } from '@nestjs/graphql';

@ObjectType()
export class MetadataRuleUpdate {
    @IsString()
    @Field({ description: 'The check property of the rule.' })
    readonly property: string;

    @IsString()
    @IsOptional()
    @Field({ description: 'The action property of the rule.' })
    readonly action?: string;

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
export class MetadataTriggerConfig {
    @IsString()
    @Field({ description: 'The start time for running the schedule.' })
    readonly startAt: string;

    @IsString()
    @Field({ description: 'The end time for running the schedule.' })
    readonly endAt: string;

    @IsNumber()
    @Field({ description: 'The numerical value of the schedule duration.' })
    readonly every: number;

    @IsString()
    @Field({ description: 'The schedule duration unit.' })
    readonly unit: string;
}

@ObjectType()
export class MetadataTrigger {
    @IsString()
    @Field({ description: 'Trigger type.' })
    readonly type: string;

    @IsString()
    @IsOptional()
    @Field({ nullable: true, description: 'Last updated at.' })
    readonly updatedAt?: string;

    @IsString()
    @Field({ description: 'Trigger config.' })
    readonly config: MetadataTriggerConfig;
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
    @Field(() => [MetadataTrigger], { description: 'The condition trigger.' })
    readonly trigger: MetadataTrigger[];
}

@ObjectType()
export class MetadataProperty {
    @IsString()
    @Field({ description: 'The name of the property.' })
    readonly name: string;

    @IsString()
    @Field({ description: 'The type of the property.' })
    readonly type: string;

    @Field(() => String, { description: 'The value of the property.' })
    readonly value: string | number;

    @IsString()
    @IsOptional()
    @Field({ nullable: true, description: 'The display value of the property.' })
    readonly display_value?: string;

    @IsString()
    @IsOptional()
    @Field({ nullable: true, description: 'Mark if this property is upgradable.' })
    readonly class?: string;
}

@ObjectType()
export class MetadataProperties {
    readonly [key: string]: MetadataProperty;
}

@ObjectType()
export class MetadataConfigAlias{
    readonly [key: string]: string;
}

@ObjectType()
export class MetadataConfigs {
    readonly alias: MetadataConfigAlias;
}

@ObjectType()
export class Metadata {
    @IsArray()
    @IsOptional()
    @Field(() => [String], { nullable: true, description: 'The plugin of the metadata' })
    readonly uses?: string[];

    @IsString()
    @IsOptional()
    @Field({ nullable: true, description: 'The name of the metadata.' })
    readonly name?: string;

    @IsString()
    @IsOptional()
    @Field({ nullable: true, description: 'The title of the metadata.' })
    readonly title?: string;

    @IsString()
    @IsOptional()
    @Field({ nullable: true, description: 'The type of the metadata.' })
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
    @Field(() => GraphQLJSONObject, { nullable: true, description: 'The properties of the metadata.' })
    readonly properties?: MetadataProperties;

    @IsObject()
    @IsOptional()
    @Field(() => MetadataConfigs, { nullable: true, description: 'The configs of the metadata.' })
    readonly configs?: MetadataConfigs;
}

@InputType('MetadataInput')
export class MetadataInput extends OmitType(Metadata, ['uses'], InputType) {}

@InputType('MetadataPropertySearchInput')
export class MetadataPropertySearchInput extends OmitType(MetadataProperty, ['type', 'display_value'], InputType) {}
