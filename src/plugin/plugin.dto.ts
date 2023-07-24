import { IsBoolean, IsObject, IsOptional, IsString } from 'class-validator';
import { GraphQLJSONObject } from 'graphql-type-json';

import { Field, InputType, ObjectType, PickType } from '@nestjs/graphql';

import { Metadata, MetadataInput } from '../metadata/metadata.dto';

@ObjectType()
export class PluginMetadata extends PickType(Metadata, ['conditions', 'properties']) {}

@ObjectType('Plugin')
export class Plugin {
    @IsString()
    @Field({ description: 'The ID for a plugin.' })
    readonly id: string;

    @IsString()
    @Field({ description: 'The name of the plugin.' })
    readonly name: string;

    @IsString()
    @IsOptional()
    @Field({ description: 'The description of the plugin.' })
    readonly description?: string;

    @IsString()
    @IsOptional()
    @Field({ description: 'The version of the plugin.' })
    readonly version?: string;

    @IsString()
    @IsOptional()
    @Field({ description: 'The author of the plugin.' })
    readonly author?: string;

    @IsBoolean()
    @Field({ description: 'Whether the plugin should be display or not.' })
    readonly isPublish?: boolean;

    @IsObject()
    @Field(() => GraphQLJSONObject, { description: 'The properties of the NFT.' })
    readonly metadata: PluginMetadata;
}

@InputType()
export class InstallOnCollectionInput {
    @IsString()
    @Field({ description: 'Collection id.' })
    readonly collectionId: string;

    @IsString()
    @Field({ description: 'Plugin id.' })
    readonly pluginId: string;

    @IsObject()
    @Field(() => GraphQLJSONObject, { description: 'The customized metadata need to be installed on chosen tier. '})
    readonly metadata: MetadataInput;
}

@InputType()
export class InstallOnTierInput {
    @IsString()
    @Field({ description: 'Tier id.' })
    readonly tierId: string;

    @IsString()
    @Field({ description: 'Plugin id.' })
    readonly pluginId: string;

    @IsObject()
    @Field(() => GraphQLJSONObject, { description: 'The customized metadata need to be installed on chosen tier. '})
    readonly metadata: MetadataInput;
}
