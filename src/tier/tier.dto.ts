import { ArgsType, Field, Int, ObjectType, InputType, ID } from '@nestjs/graphql';
import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsString, IsDateString, IsUrl, ValidateIf, IsObject, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';
import { Collection, CollectionInput } from '../collection/collection.dto';

export class Attribute {
    display_type?: string;
    trait_type: string;
    value: any;
}

@ObjectType()
export class Tier {
    @ApiProperty()
    @IsString()
    @Field({ description: 'The id of the tier.' })
    readonly id: string;

    @ApiProperty()
    @IsNumber()
    @Field({ description: 'The total number of mints for this tier.' })
    readonly totalMints: number;

    @ApiProperty()
    @IsString()
    @Field({ description: 'The name of the tier.' })
    readonly name: string;

    @ApiProperty()
    @Field(() => Collection, { description: 'The collection associated with this tier.' })
    readonly collection: Collection;

    @ApiProperty()
    @IsString()
    @Field({ description: 'The description of the tier.', nullable: true })
    readonly description?: string;

    @ApiProperty()
    @IsString()
    @Field({ description: 'This is the URL to the image of the tier.', nullable: true })
    @IsOptional()
    readonly image?: string;

    @ApiProperty()
    @IsString()
    @Field({
        description:
            "This is the URL that will appear with the asset's image and allow users to leave the marketplace and view the tier on your site.",
        nullable: true,
    })
    @IsOptional()
    readonly externalUrl?: string;

    @ApiProperty()
    @IsString()
    @Field({ description: 'This is the URL to the animation of the tier.', nullable: true })
    @IsOptional()
    readonly animationUrl?: string;

    @ApiProperty()
    @IsString()
    @Field({ description: 'A JSON object containing the attributes of the tier.', nullable: true })
    @IsOptional()
    readonly attributes?: string;
}

@InputType()
export class CreateTierInput {
    @ApiProperty()
    @IsObject()
    @Field(() => CollectionInput, { description: 'The collection associated with this tier.' })
    readonly collection: CollectionInput;

    @ApiProperty()
    @IsNumber()
    @Field({ description: 'The total number of mints for this tier.' })
    readonly totalMints: number;

    @ApiProperty()
    @IsString()
    @Field({ description: 'The name of the tier.' })
    readonly name: string;

    @ApiProperty()
    @IsString()
    @Field({ nullable: true, description: 'The description of the tier.' })
    @IsOptional()
    readonly description?: string;

    @ApiProperty()
    @IsString()
    @Field({ nullable: true, description: 'This is the URL to the image of the tier.' })
    @IsOptional()
    readonly image?: string;

    @ApiProperty()
    @IsString()
    @Field({
        nullable: true,
        description:
            "This is the URL that will appear with the asset's image and allow users to leave the marketplace and view the tier on your site.",
    })
    @IsOptional()
    readonly externalUrl?: string;

    @ApiProperty()
    @IsString()
    @Field({ nullable: true, description: 'This is the URL to the animation of the tier.' })
    @IsOptional()
    readonly animationUrl?: string;

    @ApiProperty()
    @IsString()
    @Field({ nullable: true, description: 'A JSON object containing the attributes of the tier.' })
    @IsOptional()
    readonly attributes?: string;
}

@InputType()
export class UpdateTierInput {
    @ApiProperty()
    @IsString()
    @Field({ description: 'The id of the tier.' })
    readonly id: string;

    @ApiProperty()
    @IsNumber()
    @Field({ nullable: true, description: 'The total number of mints for this tier.' })
    readonly totalMints?: number;

    @ApiProperty()
    @IsString()
    @Field({ nullable: true, description: 'The name of the tier.' })
    readonly name?: string;

    @ApiProperty()
    @IsString()
    @Field({ nullable: true, description: 'The description of the tier.' })
    @IsOptional()
    readonly description?: string;

    @ApiProperty()
    @IsString()
    @Field({ nullable: true, description: 'This is the URL to the image of the tier.' })
    @IsOptional()
    readonly image?: string;

    @ApiProperty()
    @IsString()
    @Field({
        nullable: true,
        description:
            "This is the URL that will appear with the asset's image and allow users to leave the marketplace and view the tier on your site.",
    })
    @IsOptional()
    readonly externalUrl?: string;

    @ApiProperty()
    @IsString()
    @Field({ nullable: true, description: 'This is the URL to the animation of the tier.' })
    @IsOptional()
    readonly animationUrl?: string;

    @ApiProperty()
    @IsString()
    @Field({ nullable: true, description: 'A JSON object containing the attributes of the tier.' })
    @IsOptional()
    readonly attributes?: string;
}

@InputType()
export class DeleteTierInput {
    @ApiProperty()
    @IsString()
    @Field({ description: 'The id for a tier.' })
    readonly id: string;
}
