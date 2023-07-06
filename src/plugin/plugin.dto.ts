import { IsBoolean, IsObject, IsOptional, IsString } from 'class-validator';
import { GraphQLJSONObject } from 'graphql-type-json';

import { Field, ObjectType } from '@nestjs/graphql';

import { Metadata } from '../metadata/metadata.dto';

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
    readonly metadata: { [key: string]: Metadata };
}
