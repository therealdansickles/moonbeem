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
    @Field({ description: 'Start time for running the schedule.' })
    start: string;

    @IsString()
    @Field({ description: 'Ent time for running the schedule.' })
    end: string;

    @IsNumber()
    @Field({ description: 'Schedule period.' })
    every: number;

    @IsString()
    @Field({ description: 'Schedule period unit.' })
    unit: string;
}

@ObjectType()
export class MetadataTrigger {
    @IsString()
    @Field({ description: 'Trigger type.' })
    readonly type: string;

    @IsString()
    @IsOptional()
    @Field({ nullable: true, description: 'Last updated at.' })
    readonly last_updated_at?: string;

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

    @IsString()
    @IsOptional()
    @Field({ nullable: true, description: 'The display value of the property.' })
    readonly display_value?: string;

    @Field(() => String, { description: 'The value of the property.' })
    readonly value: string | number;
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
    readonly properties?: { [key: string]: MetadataProperty };
}

@InputType('MetadataInput')
export class MetadataInput extends OmitType(Metadata, ['uses'], InputType) {}

@InputType('MetadataPropertySearchInput')
export class MetadataPropertySearchInput extends OmitType(MetadataProperty, ['type', 'display_value'], InputType) {}
