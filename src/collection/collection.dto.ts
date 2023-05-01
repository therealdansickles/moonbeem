import { Field, Int, ObjectType, InputType, registerEnumType, ID } from '@nestjs/graphql';

import { IsNumber, IsString, IsDateString, IsUrl, ValidateIf, IsOptional, IsArray, IsEnum } from 'class-validator';
import { CollectionKind } from './collection.entity';
import { CreateTierInput, Tier } from '../tier/tier.dto';
import { Organization } from '../organization/organization.dto';

registerEnumType(CollectionKind, { name: 'CollectionKind' });

@ObjectType('Collection')
export class Collection {
    @IsString()
    @Field({ description: 'The ID for a collection' })
    readonly id: string;

    @IsString()
    @Field({ description: 'The unique URL-friendly identifier for a collection.' })
    readonly name: string;

    @IsString()
    @Field({ description: 'The name that we display for the collection.' })
    readonly displayName: string;

    @Field((type) => CollectionKind, { description: 'The type of collection this is.' })
    readonly kind: CollectionKind;

    @IsString()
    @ValidateIf((object, value) => value !== null)
    @Field({ description: 'The description for the collection.', nullable: true })
    readonly about?: string;

    @Field({
        description: "The address of the collection, e.g. '0x6bf9ec331e083627b0f48332ece2d99a7eb7fb0c'",
        nullable: true,
    })
    @IsOptional()
    readonly address?: string;

    @IsUrl()
    @Field({
        description: 'The image url for the avatar of the collection. This is the profile picture.',
        nullable: true,
    })
    readonly avatarUrl?: string;

    @IsUrl()
    @ValidateIf((object, value) => value !== null)
    @Field({ description: 'The image url for the background of the collection.', nullable: true })
    readonly backgroundUrl?: string;

    @IsUrl()
    @ValidateIf((object, value) => value !== null)
    @Field({ description: 'The url for the website associated with this collection', nullable: true })
    readonly websiteUrl?: string;

    @IsString()
    @ValidateIf((object, value) => value !== null)
    @Field({ description: "The twitter handle associated with this collection, e.g. 'vibe-labs'", nullable: true })
    readonly twitter?: string;

    @IsString()
    @ValidateIf((object, value) => value !== null)
    @Field({ description: "The instagram handle associated with this collection, e.g. 'vibe-labs'", nullable: true })
    readonly instagram?: string;

    @IsString()
    @ValidateIf((object, value) => value !== null)
    @Field({ description: "The discord handle associated with this collection, e.g. 'vibe-labs", nullable: true })
    readonly discord?: string;

    @IsString()
    @Field((type) => [String], { description: 'The tags associated with this organization.', nullable: true })
    readonly tags: string[];

    @Field((type) => [Tier], { description: 'The collection tiers', nullable: true })
    @IsArray()
    readonly tiers: Tier[];

    @IsDateString()
    @Field({ description: 'The DateTime that this collection was published.', nullable: true })
    readonly publishedAt?: Date;

    @IsDateString()
    @Field({ description: 'The DateTime that this collection was created(initially created as a draft).' })
    readonly createdAt: Date;

    @IsDateString()
    @Field({ description: 'The DateTime that this collection was last updated.' })
    readonly updatedAt: Date;

    @IsString()
    @Field({ description: 'The wallet that created the collection.', nullable: true })
    readonly creatorId?: string;

    @Field(() => Organization, { description: 'The organization that owns the collection.', nullable: true })
    readonly organization: Organization;
}

@InputType()
export class CreateCollectionInput {
    @IsString()
    @Field({ description: 'The unique URL-friendly identifier for a collection.' })
    readonly name: string;

    @IsString()
    @Field({ description: 'The name that we display for the collection.' })
    readonly displayName: string;

    @Field((type) => CollectionKind, { description: 'The type of collection this is.' })
    readonly kind: CollectionKind;

    @IsString()
    @ValidateIf((object, value) => value !== null)
    @Field({ description: 'The description for the collection.', nullable: true })
    @IsOptional()
    readonly about: string;

    @IsUrl()
    @Field({
        description: 'The image url for the avatar of the collection. This is the profile picture.',
        nullable: true,
    })
    @IsOptional()
    readonly avatarUrl?: string;

    @IsUrl()
    @ValidateIf((object, value) => value !== null)
    @Field({ description: 'The image url for the background of the collection.', nullable: true })
    @IsOptional()
    readonly backgroundUrl?: string;

    @IsUrl()
    @ValidateIf((object, value) => value !== null)
    @Field({ description: 'The url for the website associated with this collection', nullable: true })
    @IsOptional()
    readonly websiteUrl?: string;

    @IsString()
    @ValidateIf((object, value) => value !== null)
    @Field({ description: "The twitter handle associated with this collection, e.g. 'vibe-labs'", nullable: true })
    @IsOptional()
    readonly twitter?: string;

    @IsString()
    @ValidateIf((object, value) => value !== null)
    @Field({ description: "The instagram handle associated with this collection, e.g. 'vibe-labs'", nullable: true })
    @IsOptional()
    readonly instagram?: string;

    @IsString()
    @ValidateIf((object, value) => value !== null)
    @Field({ description: "The discord handle associated with this collection, e.g. 'vibe-labs", nullable: true })
    @IsOptional()
    readonly discord?: string;

    @Field((type) => [String], { description: 'The tags associated with this organization.', nullable: true })
    @IsOptional()
    readonly tags?: string[];

    @Field({
        description: "The address of the collection, e.g. '0x6bf9ec331e083627b0f48332ece2d99a7eb7fb0c'",
        nullable: true,
    })
    @IsOptional()
    readonly address?: string;

    @IsNumber()
    @Field((type) => Int!, { description: 'The chainId of the collection.', nullable: true })
    @IsOptional()
    readonly chainId?: number;

    @IsString()
    @Field({ description: 'The description for the collection.', nullable: true })
    @IsOptional()
    readonly creatorId?: string;
}

@InputType()
export class UpdateCollectionInput {
    @IsString()
    @Field({ description: 'The id for a collection.' })
    readonly id: string;

    @IsString()
    @Field({ description: 'The unique URL-friendly identifier for a collection.', nullable: true })
    readonly name?: string;

    @IsString()
    @Field({ description: 'The name that we display for the collection.', nullable: true })
    readonly displayName?: string;

    @Field({
        description: "The address of the collection, e.g. '0x6bf9ec331e083627b0f48332ece2d99a7eb7fb0c'",
        nullable: true,
    })
    readonly address?: string;

    @IsString()
    @Field((type) => Int!, { description: 'The chainId of the collection.', nullable: true })
    readonly chainId?: number;

    @IsString()
    @ValidateIf((object, value) => value !== null)
    @Field({ description: 'The description for the collection.', nullable: true })
    readonly about?: string;

    @IsUrl()
    @Field({
        description: 'The image url for the avatar of the collection. This is the profile picture.',
        nullable: true,
    })
    readonly avatarUrl?: string;

    @IsUrl()
    @ValidateIf((object, value) => value !== null)
    @Field({ description: 'The image url for the background of the collection.', nullable: true })
    readonly backgroundUrl?: string;

    @IsUrl()
    @ValidateIf((object, value) => value !== null)
    @Field({ description: 'The url for the website associated with this collection', nullable: true })
    readonly websiteUrl?: string;

    @IsString()
    @ValidateIf((object, value) => value !== null)
    @Field({ description: "The twitter handle associated with this collection, e.g. 'vibe-labs'", nullable: true })
    readonly twitter?: string;

    @IsString()
    @ValidateIf((object, value) => value !== null)
    @Field({ description: "The instagram handle associated with this collection, e.g. 'vibe-labs'", nullable: true })
    readonly instagram?: string;

    @IsString()
    @ValidateIf((object, value) => value !== null)
    @Field({ description: "The discord handle associated with this collection, e.g. 'vibe-labs", nullable: true })
    readonly discord?: string;

    @Field((type) => [String], { description: 'The tags associated with this organization.', nullable: true })
    readonly tags?: [string];
}

@InputType()
export class PublishCollectionInput {
    @IsString()
    @Field({ description: 'The id for a collection.' })
    readonly id: string;
}

@InputType()
export class DeleteCollectionInput {
    @IsString()
    @Field({ description: 'The id for a collection.' })
    readonly id: string;
}

@InputType('CollectionInput')
export class CollectionInput {
    @IsString()
    @Field((returns) => ID!)
    id: string;
}

@InputType('CreateCollectionWithTiersInput')
export class CreateCollectionWithTiersInput {
    @IsString()
    @Field({ description: 'The unique URL-friendly identifier for a collection.' })
    readonly name: string;

    @IsString()
    @Field({ description: 'The name that we display for the collection.' })
    readonly displayName: string;

    @Field((type) => CollectionKind, { description: 'The type of collection this is.' })
    readonly kind: CollectionKind;

    @IsString()
    @ValidateIf((object, value) => value !== null)
    @Field({ description: 'The description for the collection.', nullable: true })
    @IsOptional()
    readonly about: string;

    @IsUrl()
    @Field({
        description: 'The image url for the avatar of the collection. This is the profile picture.',
        nullable: true,
    })
    @IsOptional()
    readonly avatarUrl?: string;

    @IsUrl()
    @ValidateIf((object, value) => value !== null)
    @Field({ description: 'The image url for the background of the collection.', nullable: true })
    @IsOptional()
    readonly backgroundUrl?: string;

    @IsUrl()
    @ValidateIf((object, value) => value !== null)
    @Field({ description: 'The url for the website associated with this collection', nullable: true })
    @IsOptional()
    readonly websiteUrl?: string;

    @IsString()
    @ValidateIf((object, value) => value !== null)
    @Field({ description: "The twitter handle associated with this collection, e.g. 'vibe-labs'", nullable: true })
    @IsOptional()
    readonly twitter?: string;

    @IsString()
    @ValidateIf((object, value) => value !== null)
    @Field({ description: "The instagram handle associated with this collection, e.g. 'vibe-labs'", nullable: true })
    @IsOptional()
    readonly instagram?: string;

    @IsString()
    @ValidateIf((object, value) => value !== null)
    @Field({ description: "The discord handle associated with this collection, e.g. 'vibe-labs", nullable: true })
    @IsOptional()
    readonly discord?: string;

    @Field((type) => [String], { description: 'The tags associated with this organization.', nullable: true })
    @IsOptional()
    readonly tags?: string[];

    @Field({
        description: "The address of the collection, e.g. '0x6bf9ec331e083627b0f48332ece2d99a7eb7fb0c'",
        nullable: true,
    })
    @IsOptional()
    readonly address?: string;

    @IsNumber()
    @Field((type) => Int!, { description: 'The chainId of the collection.', nullable: true })
    @IsOptional()
    readonly chainId?: number;

    @IsString()
    @Field({ description: 'The description for the collection.', nullable: true })
    @IsOptional()
    readonly creatorId?: string;

    @IsArray()
    @Field((type) => [CreateTierInCollectionInput], { description: 'This tiers for collection' })
    readonly tiers: CreateTierInCollectionInput[];
}

@InputType('CreateTierInCollectionInput')
export class CreateTierInCollectionInput {
    @IsNumber()
    @Field((type) => Int, { description: 'The total number of mints for this tier.' })
    readonly totalMints: number;

    @IsString()
    @Field({ description: 'The name of the tier.' })
    readonly name: string;

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
