import { ArgsType, Field, Int, ObjectType, InputType, ID } from '@nestjs/graphql';
import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsString, IsDateString, IsUrl, ValidateIf, IsEnum, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';
import { OrganizationKind } from './organization.entity';

@ObjectType('Organization')
export class Organization {
    @ApiProperty()
    @IsString()
    @Field((returns) => ID!)
    readonly id: string;

    @ApiProperty()
    @IsString()
    @Field({ description: 'The unique URL-friendly identifier for a organization.' })
    readonly name: string;

    @ApiProperty()
    @IsString()
    @Field({ description: 'The name that we display for the organization.' })
    readonly displayName: string;

    @ApiProperty()
    @IsOptional()
    @IsEnum(OrganizationKind)
    @Field({ description: "The type of organization this is. e.g 'personal', 'general'." })
    readonly kind?: OrganizationKind;

    @ApiProperty()
    @IsString()
    @ValidateIf((object, value) => value !== null)
    @Field({ description: 'The description for the organization.', nullable: true })
    readonly about?: string;

    @ApiProperty()
    @IsOptional()
    @IsUrl()
    @Field({ description: 'The image url for the avatar of the organization. This is the profile picture.' })
    readonly avatarUrl?: string;

    @ApiProperty()
    @IsUrl()
    @ValidateIf((object, value) => value !== null)
    @Field({ description: 'The image url for the background of the organization.', nullable: true })
    readonly backgroundUrl?: string;

    @ApiProperty()
    @IsUrl()
    @ValidateIf((object, value) => value !== null)
    @Field({ description: 'The url for the website associated with this organization', nullable: true })
    readonly websiteUrl?: string;

    @ApiProperty()
    @IsString()
    @ValidateIf((object, value) => value !== null)
    @Field({ description: "The twitter handle associated with this organization, e.g. 'vibe-labs'", nullable: true })
    readonly twitter?: string;

    @ApiProperty()
    @IsString()
    @ValidateIf((object, value) => value !== null)
    @Field({ description: "The instagram handle associated with this organization, e.g. 'vibe-labs'", nullable: true })
    readonly instagram?: string;

    @ApiProperty()
    @IsString()
    @ValidateIf((object, value) => value !== null)
    @Field({ description: "The discord handle associated with this organization, e.g. 'vibe-labs", nullable: true })
    readonly discord?: string;

    @ApiProperty()
    @IsDateString()
    @Field({ description: 'The DateTime that this organization was created(initially created as a draft).' })
    readonly createdAt: Date;

    @ApiProperty()
    @IsDateString()
    @Field({ description: 'The DateTime that this organization was last updated.' })
    readonly updatedAt: Date;
}

@InputType('CreateOrganizationInput')
export class CreateOrganizationInput {
    @ApiProperty()
    @IsString()
    @Field({ description: 'The unique URL-friendly identifier for a organization.' })
    readonly name: string;

    @ApiProperty()
    @IsString()
    @Field({ description: 'The name that we display for the organization.', nullable: true })
    readonly displayName?: string;

    @ApiProperty()
    @IsString()
    @ValidateIf((object, value) => value !== null)
    @Field({ description: 'The description for the organization.', nullable: true })
    readonly about?: string;

    @ApiProperty()
    @IsUrl()
    @Field({ description: 'The image url for the avatar of the organization. This is the profile picture.' })
    readonly avatarUrl: string;

    @ApiProperty()
    @IsUrl()
    @ValidateIf((object, value) => value !== null)
    @Field({ description: 'The image url for the background of the organization.', nullable: true })
    readonly backgroundUrl?: string;

    @ApiProperty()
    @IsUrl()
    @ValidateIf((object, value) => value !== null)
    @Field({ description: 'The url for the website associated with this organization', nullable: true })
    readonly websiteUrl?: string;

    @ApiProperty()
    @IsString()
    @ValidateIf((object, value) => value !== null)
    @Field({ description: "The twitter handle associated with this organization, e.g. 'vibe-labs'", nullable: true })
    readonly twitter?: string;

    @ApiProperty()
    @IsString()
    @ValidateIf((object, value) => value !== null)
    @Field({ description: "The instagram handle associated with this organization, e.g. 'vibe-labs'", nullable: true })
    readonly instagram?: string;

    @ApiProperty()
    @IsString()
    @ValidateIf((object, value) => value !== null)
    @Field({ description: "The discord handle associated with this organization, e.g. 'vibe-labs", nullable: true })
    readonly discord?: string;

    //@ApiProperty()
    //@IsString()
    //@Field((type) => ID, { description: 'The owner of the organization.' })
    //readonly ownerId: string;
}

@InputType()
export class UpdateOrganizationInput {
    @ApiProperty()
    @IsString()
    @Field({ description: 'The id of the organization.' })
    readonly id: string;

    @ApiProperty()
    @IsString()
    @Field({ description: 'The unique URL-friendly identifier for a organization.', nullable: true })
    readonly name?: string;

    @ApiProperty()
    @IsString()
    @Field({ description: 'The name that we display for the organization.', nullable: true })
    readonly displayName?: string;

    @ApiProperty()
    @IsString()
    @ValidateIf((object, value) => value !== null)
    @Field({ description: 'The description for the organization.', nullable: true })
    readonly about?: string;

    @ApiProperty()
    @IsUrl()
    @Field({ description: 'The image url for the avatar of the organization. This is the profile picture.', nullable: true })
    readonly avatarUrl?: string;

    @ApiProperty()
    @IsUrl()
    @ValidateIf((object, value) => value !== null)
    @Field({ description: 'The image url for the background of the organization.', nullable: true })
    readonly backgroundUrl?: string;

    @ApiProperty()
    @IsUrl()
    @ValidateIf((object, value) => value !== null)
    @Field({ description: 'The url for the website associated with this organization', nullable: true })
    readonly websiteUrl?: string;

    @ApiProperty()
    @IsString()
    @ValidateIf((object, value) => value !== null)
    @Field({ description: "The twitter handle associated with this organization, e.g. 'vibe-labs'", nullable: true })
    readonly twitter?: string;

    @ApiProperty()
    @IsString()
    @ValidateIf((object, value) => value !== null)
    @Field({ description: "The instagram handle associated with this organization, e.g. 'vibe-labs'", nullable: true })
    readonly instagram?: string;

    @ApiProperty()
    @IsString()
    @ValidateIf((object, value) => value !== null)
    @Field({ description: "The discord handle associated with this organization, e.g. 'vibe-labs", nullable: true })
    readonly discord?: string;
}

@InputType()
export class DeleteOrganizationInput {
    @ApiProperty()
    @IsString()
    @Field({ description: 'The id of the organization.' })
    readonly id: string;
}

@InputType()
export class TransferOrganizationInput {
    @ApiProperty()
    @IsString()
    @Field({ description: 'The id of the organization.' })
    readonly id: string;

    @ApiProperty()
    @IsString()
    @Field({ description: 'The new ownerId of the organization.' })
    readonly ownerId: string;
}
