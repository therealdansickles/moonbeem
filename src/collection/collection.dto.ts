import { ArgsType, Field, Int, ObjectType, InputType, registerEnumType } from '@nestjs/graphql';
import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsString, IsDateString, IsUrl, ValidateIf, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';
import { CollectionKind } from './collection.entity';

registerEnumType(CollectionKind, { name: 'CollectionKind' });

@ObjectType('Collection')
export class Collection {
    @ApiProperty()
    @IsString()
    @Field({ description: 'The ID for a collection' })
    readonly id: string;

    @ApiProperty()
    @IsString()
    @Field({ description: 'The unique URL-friendly identifier for a collection.' })
    readonly name: string;

    @ApiProperty()
    @IsString()
    @Field({ description: 'The name that we display for the collection.' })
    readonly displayName: string;

    @ApiProperty()
    @Field((type) => CollectionKind, { description: 'The type of collection this is.' })
    readonly kind: CollectionKind;

    @ApiProperty()
    @IsString()
    @ValidateIf((object, value) => value !== null)
    @Field({ description: 'The description for the collection.', nullable: true })
    readonly about?: string;

    @ApiProperty()
    @IsUrl()
    @Field({
        description: 'The image url for the avatar of the collection. This is the profile picture.',
        nullable: true,
    })
    readonly avatarUrl?: string;

    @ApiProperty()
    @IsUrl()
    @ValidateIf((object, value) => value !== null)
    @Field({ description: 'The image url for the background of the collection.', nullable: true })
    readonly backgroundUrl?: string;

    @ApiProperty()
    @IsUrl()
    @ValidateIf((object, value) => value !== null)
    @Field({ description: 'The url for the website associated with this collection', nullable: true })
    readonly websiteUrl?: string;

    @ApiProperty()
    @IsString()
    @ValidateIf((object, value) => value !== null)
    @Field({ description: "The twitter handle associated with this collection, e.g. 'vibe-labs'", nullable: true })
    readonly twitter?: string;

    @ApiProperty()
    @IsString()
    @ValidateIf((object, value) => value !== null)
    @Field({ description: "The instagram handle associated with this collection, e.g. 'vibe-labs'", nullable: true })
    readonly instagram?: string;

    @ApiProperty()
    @IsString()
    @ValidateIf((object, value) => value !== null)
    @Field({ description: "The discord handle associated with this collection, e.g. 'vibe-labs", nullable: true })
    readonly discord?: string;

    @ApiProperty()
    @IsString()
    @Field((type) => [String], { description: 'The tags associated with this organization.', nullable: true })
    readonly tags: string[];

    @ApiProperty()
    @IsDateString()
    @Field({ description: 'The DateTime that this collection was published.', nullable: true })
    readonly publishedAt?: Date;

    @ApiProperty()
    @IsDateString()
    @Field({ description: 'The DateTime that this collection was created(initially created as a draft).' })
    readonly createdAt: Date;

    @ApiProperty()
    @IsDateString()
    @Field({ description: 'The DateTime that this collection was last updated.' })
    readonly updatedAt: Date;

    @ApiProperty()
    @IsString()
    @Field({ description: 'The wallet that created the collection.', nullable: true })
    readonly creatorId?: string;
}

@InputType()
export class CreateCollectionInput {
    @ApiProperty()
    @IsString()
    @Field({ description: 'The unique URL-friendly identifier for a collection.' })
    readonly name: string;

    @ApiProperty()
    @IsString()
    @Field({ description: 'The name that we display for the collection.' })
    readonly displayName: string;

    @ApiProperty()
    @Field((type) => CollectionKind, { description: 'The type of collection this is.' })
    readonly kind: CollectionKind;

    @ApiProperty()
    @IsString()
    @ValidateIf((object, value) => value !== null)
    @Field({ description: 'The description for the collection.', nullable: true })
    @IsOptional()
    readonly about: string;

    @ApiProperty()
    @IsUrl()
    @Field({
        description: 'The image url for the avatar of the collection. This is the profile picture.',
        nullable: true,
    })
    @IsOptional()
    readonly avatarUrl?: string;

    @ApiProperty()
    @IsUrl()
    @ValidateIf((object, value) => value !== null)
    @Field({ description: 'The image url for the background of the collection.', nullable: true })
    @IsOptional()
    readonly backgroundUrl?: string;

    @ApiProperty()
    @IsUrl()
    @ValidateIf((object, value) => value !== null)
    @Field({ description: 'The url for the website associated with this collection', nullable: true })
    @IsOptional()
    readonly websiteUrl?: string;

    @ApiProperty()
    @IsString()
    @ValidateIf((object, value) => value !== null)
    @Field({ description: "The twitter handle associated with this collection, e.g. 'vibe-labs'", nullable: true })
    @IsOptional()
    readonly twitter?: string;

    @ApiProperty()
    @IsString()
    @ValidateIf((object, value) => value !== null)
    @Field({ description: "The instagram handle associated with this collection, e.g. 'vibe-labs'", nullable: true })
    @IsOptional()
    readonly instagram?: string;

    @ApiProperty()
    @IsString()
    @ValidateIf((object, value) => value !== null)
    @Field({ description: "The discord handle associated with this collection, e.g. 'vibe-labs", nullable: true })
    @IsOptional()
    readonly discord?: string;

    @ApiProperty()
    @Field((type) => [String], { description: 'The tags associated with this organization.', nullable: true })
    @IsOptional()
    readonly tags?: string[];

    @ApiProperty()
    @Field({
        description: "The address of the collection, e.g. '0x6bf9ec331e083627b0f48332ece2d99a7eb7fb0c'",
        nullable: true,
    })
    @IsOptional()
    readonly address?: string;

    @ApiProperty()
    @IsNumber()
    @Field((type) => Int!, { description: 'The chainId of the collection.', nullable: true })
    @IsOptional()
    readonly chainId?: number;

    @ApiProperty()
    @IsString()
    @Field({ description: 'The description for the collection.', nullable: true })
    @IsOptional()
    readonly creatorId?: string;
}

@InputType()
export class UpdateCollectionInput {
    @ApiProperty()
    @IsString()
    @Field({ description: 'The id for a collection.' })
    readonly id: string;

    @ApiProperty()
    @IsString()
    @Field({ description: 'The unique URL-friendly identifier for a collection.', nullable: true })
    readonly name?: string;

    @ApiProperty()
    @IsString()
    @Field({ description: 'The name that we display for the collection.', nullable: true })
    readonly displayName?: string;

    @ApiProperty()
    @Field({
        description: "The address of the collection, e.g. '0x6bf9ec331e083627b0f48332ece2d99a7eb7fb0c'",
        nullable: true,
    })
    readonly address?: string;

    @ApiProperty()
    @IsString()
    @Field((type) => Int!, { description: 'The chainId of the collection.', nullable: true })
    readonly chainId?: number;

    @ApiProperty()
    @IsString()
    @ValidateIf((object, value) => value !== null)
    @Field({ description: 'The description for the collection.', nullable: true })
    readonly about?: string;

    @ApiProperty()
    @IsUrl()
    @Field({
        description: 'The image url for the avatar of the collection. This is the profile picture.',
        nullable: true,
    })
    readonly avatarUrl?: string;

    @ApiProperty()
    @IsUrl()
    @ValidateIf((object, value) => value !== null)
    @Field({ description: 'The image url for the background of the collection.', nullable: true })
    readonly backgroundUrl?: string;

    @ApiProperty()
    @IsUrl()
    @ValidateIf((object, value) => value !== null)
    @Field({ description: 'The url for the website associated with this collection', nullable: true })
    readonly websiteUrl?: string;

    @ApiProperty()
    @IsString()
    @ValidateIf((object, value) => value !== null)
    @Field({ description: "The twitter handle associated with this collection, e.g. 'vibe-labs'", nullable: true })
    readonly twitter?: string;

    @ApiProperty()
    @IsString()
    @ValidateIf((object, value) => value !== null)
    @Field({ description: "The instagram handle associated with this collection, e.g. 'vibe-labs'", nullable: true })
    readonly instagram?: string;

    @ApiProperty()
    @IsString()
    @ValidateIf((object, value) => value !== null)
    @Field({ description: "The discord handle associated with this collection, e.g. 'vibe-labs", nullable: true })
    readonly discord?: string;

    @ApiProperty()
    @Field((type) => [String], { description: 'The tags associated with this organization.', nullable: true })
    readonly tags?: [string];
}

@InputType()
export class PublishCollectionInput {
    @ApiProperty()
    @IsString()
    @Field({ description: 'The id for a collection.' })
    readonly id: string;
}

@InputType()
export class DeleteCollectionInput {
    @ApiProperty()
    @IsString()
    @Field({ description: 'The id for a collection.' })
    readonly id: string;
}
