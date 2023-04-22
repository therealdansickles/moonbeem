import { ArgsType, Field, Int, ObjectType, InputType, ID } from '@nestjs/graphql';
import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsString, IsDateString, IsUrl, ValidateIf } from 'class-validator';
import { Type } from 'class-transformer';

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
    @IsString()
    @Field({ description: 'The description of the tier.' })
    readonly description?: string;

    @ApiProperty()
    @IsString()
    @Field({ description: 'This is the URL to the image of the tier.' })
    readonly image?: string;

    @ApiProperty()
    @IsString()
    @Field({
        description:
            "This is the URL that will appear with the asset's image and allow users to leave the marketplace and view the tier on your site.",
    })
    readonly externalUrl?: string;

    @ApiProperty()
    @IsString()
    @Field({ description: 'This is the URL to the animation of the tier.' })
    readonly animationUrl?: string;

    @ApiProperty()
    @IsString()
    @Field({ description: 'A JSON object containing the attributes of the tier.' })
    readonly attributes?: string;
}

@InputType()
export class CreateTierInput {
    @ApiProperty()
    @IsString()
    @Field({ description: 'The collection associated with this tier.' })
    readonly collectionId: string;

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
    readonly description?: string;

    @ApiProperty()
    @IsString()
    @Field({ nullable: true, description: 'This is the URL to the image of the tier.' })
    readonly image?: string;

    @ApiProperty()
    @IsString()
    @Field({
        nullable: true,
        description:
            "This is the URL that will appear with the asset's image and allow users to leave the marketplace and view the tier on your site.",
    })
    readonly externalUrl?: string;

    @ApiProperty()
    @IsString()
    @Field({ nullable: true, description: 'This is the URL to the animation of the tier.' })
    readonly animationUrl?: string;

    @ApiProperty()
    @IsString()
    @Field({ nullable: true, description: 'A JSON object containing the attributes of the tier.' })
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
    readonly description?: string;

    @ApiProperty()
    @IsString()
    @Field({ nullable: true, description: 'This is the URL to the image of the tier.' })
    readonly image?: string;

    @ApiProperty()
    @IsString()
    @Field({
        nullable: true,
        description:
            "This is the URL that will appear with the asset's image and allow users to leave the marketplace and view the tier on your site.",
    })
    readonly externalUrl?: string;

    @ApiProperty()
    @IsString()
    @Field({ nullable: true, description: 'This is the URL to the animation of the tier.' })
    readonly animationUrl?: string;

    @ApiProperty()
    @IsString()
    @Field({ nullable: true, description: 'A JSON object containing the attributes of the tier.' })
    readonly attributes?: string;
}

@InputType()
export class DeleteTierInput {
    @ApiProperty()
    @IsString()
    @Field({ description: 'The id for a tier.' })
    readonly id: string;
}
