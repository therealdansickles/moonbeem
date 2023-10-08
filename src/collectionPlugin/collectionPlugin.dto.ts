import { MetadataProperties } from '../metadata/metadata.entity';
import { IsBoolean, IsObject, IsOptional, IsString } from 'class-validator';
import { Field, InputType, ObjectType, OmitType } from '@nestjs/graphql';
import { GraphQLJSONObject } from 'graphql-type-json';
import { Metadata, MetadataInput } from '../metadata/metadata.dto';
import { Plugin } from '../plugin/plugin.dto';
import { Collection } from '../collection/collection.dto';

type NumberFilter = {
    attribute: string;
    start?: string;
    end?: string;
};

type StringFilter = {
    attribute: string;
    equals?: string;
};

type PropertyFilter = NumberFilter | StringFilter;

export type RecipientFilters = {
    propertyFilters: PropertyFilter[];
    manuallyAddedTokens: string[];
    manuallyDeletedTokens: string[];
};

export type Recipient = {
    tokenId: string;
    quantity?: number;
};

export type AirdropPluginDetail = {
    properties: MetadataProperties;
    recipients: Recipient[];
    filters: RecipientFilters;
};

export type PluginDetail = AirdropPluginDetail | any;

@ObjectType()
export class CollectionPlugin {
    @IsString()
    @Field({ description: 'The id of the collection plugin.' })
    readonly id: string;

    @IsString()
    @IsOptional()
    @Field({ description: 'The name of the collection plugin.', nullable: true })
    readonly name?: string;

    @IsString()
    @Field({ nullable: true, description: 'The description of the tier.' })
    @IsOptional()
    readonly description?: string;

    @IsString()
    @Field({ description: 'The media of this collection plugin.', nullable: true })
    @IsOptional()
    readonly mediaUrl?: string;

    @Field(() => GraphQLJSONObject, { nullable: true, description: 'The collection plugin detail.' })
    @IsObject()
    @IsOptional()
    readonly pluginDetail?: PluginDetail;

    @IsObject()
    @Field(() => Plugin, { description: 'The plugin info.' })
    readonly plugin: Plugin;

    @IsString()
    @Field({ nullable: true, description: 'This merkle root of the recipients.' })
    @IsOptional()
    readonly merkleRoot?: string;

    @IsObject()
    @Field(() => Collection, { description: 'The collection info.' })
    readonly collection: Collection;

    @IsObject()
    @IsOptional()
    @Field(
        () => GraphQLJSONObject,
        { nullable: true, description: 'The customized metadata need to be installed on chosen collection. ' }
    )
    readonly metadata?: Metadata;
}

@ObjectType()
export class InstalledPluginInfo {
    @IsString()
    @IsOptional()
    @Field({ description: 'The name of the collection plugin.', nullable: true })
    readonly name?: string;

    @IsString()
    @IsOptional()
    @Field({ description: 'The address of the plugin collection.', nullable: true })
    readonly collectionAddress?: string;

    @IsString()
    @IsOptional()
    @Field({ description: 'The address of the token.', nullable: true })
    readonly tokenAddress?: string;

    @IsString()
    @Field({ description: 'The name of the plugin.' })
    readonly pluginName: string;

    @IsBoolean()
    @IsOptional()
    @Field({ description: 'The plugin is claimed or not.', nullable: true })
    readonly claimed: boolean;

    @IsString()
    @IsOptional()
    @Field({ description: 'The description of the collection plugin.' })
    readonly description?: string;

    @IsString()
    @IsOptional()
    @Field({ description: 'The media url of the collection plugin.' })
    readonly mediaUrl?: string;
}

@InputType()
export class CreateCollectionPluginInput extends OmitType(
    CollectionPlugin, ['id', 'metadata', 'plugin', 'collection'], InputType) {
    // Reserved to be used for the rule engine plugin
    @IsObject()
    @IsOptional()
    @Field(
        () => GraphQLJSONObject,
        { nullable: true, description: 'The customized metadata need to be installed on chosen collection. ' }
    )
    readonly metadata?: MetadataInput;

    @IsString()
    @Field()
    readonly collectionId: string;

    @IsString()
    @Field()
    readonly pluginId: string;
}

@InputType()
export class UpdateCollectionPluginInput extends OmitType(
    CreateCollectionPluginInput, ['collectionId', 'pluginId'], InputType) {
    @IsString()
    @Field({ description: 'The id of the collection plugin.' })
    readonly id: string;
}
