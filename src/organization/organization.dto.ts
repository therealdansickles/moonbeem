import { ArgsType, Field, Int, ObjectType, InputType, ID } from '@nestjs/graphql';
import { ApiProperty } from '@nestjs/swagger';
import {
    IsNumber,
    IsString,
    IsDateString,
    IsUrl,
    ValidateIf,
    IsEnum,
    IsOptional,
    IsObject,
    IsArray,
    IsBoolean,
} from 'class-validator';
import { OrganizationKind } from './organization.entity';
import { User, UserInput } from '../user/user.dto';

@ObjectType('Organization')
export class Organization {
    @IsString()
    @Field((returns) => ID!)
    readonly id: string;

    @Field(() => User, { description: 'The owner of the organization.' })
    readonly owner: User;

    @IsString()
    @Field({ description: 'The unique URL-friendly identifier for a organization.' })
    readonly name: string;

    @IsString()
    @Field({ description: 'The name that we display for the organization.' })
    readonly displayName: string;

    @IsOptional()
    @IsEnum(OrganizationKind)
    @Field({ description: "The type of organization this is. e.g 'personal', 'general'." })
    readonly kind?: OrganizationKind;

    @IsString()
    @ValidateIf((object, value) => value !== null)
    @Field({ description: 'The description for the organization.', nullable: true })
    readonly about?: string;

    @IsOptional()
    @IsUrl()
    @Field({ description: 'The image url for the avatar of the organization. This is the profile picture.' })
    readonly avatarUrl?: string;

    @IsUrl()
    @ValidateIf((object, value) => value !== null)
    @Field({ description: 'The image url for the background of the organization.', nullable: true })
    readonly backgroundUrl?: string;

    @IsUrl()
    @ValidateIf((object, value) => value !== null)
    @Field({ description: 'The url for the website associated with this organization', nullable: true })
    readonly websiteUrl?: string;

    @IsString()
    @ValidateIf((object, value) => value !== null)
    @Field({ description: "The twitter handle associated with this organization, e.g. 'vibe-labs'", nullable: true })
    readonly twitter?: string;

    @IsString()
    @ValidateIf((object, value) => value !== null)
    @Field({ description: "The instagram handle associated with this organization, e.g. 'vibe-labs'", nullable: true })
    readonly instagram?: string;

    @IsString()
    @ValidateIf((object, value) => value !== null)
    @Field({ description: "The discord handle associated with this organization, e.g. 'vibe-labs", nullable: true })
    readonly discord?: string;

    @IsDateString()
    @Field({ description: 'The DateTime that this organization was created(initially created as a draft).' })
    readonly createdAt: Date;

    @IsDateString()
    @Field({ description: 'The DateTime that this organization was last updated.' })
    readonly updatedAt: Date;
}

@InputType('CreateOrganizationInput')
export class CreateOrganizationInput {
    @IsString()
    @Field({ description: 'The unique URL-friendly identifier for a organization.' })
    readonly name: string;

    @IsObject()
    @Field(() => UserInput, { description: 'The owner of the organization.' })
    readonly owner: UserInput;

    @IsString()
    @Field({ description: 'The name that we display for the organization.', nullable: true })
    @IsOptional()
    readonly displayName?: string;

    @IsString()
    @ValidateIf((object, value) => value !== null)
    @Field({ description: 'The description for the organization.', nullable: true })
    @IsOptional()
    readonly about?: string;

    @IsUrl()
    @Field({
        description: 'The image url for the avatar of the organization. This is the profile picture.',
        nullable: true,
    })
    readonly avatarUrl?: string;

    @IsUrl()
    @ValidateIf((object, value) => value !== null)
    @Field({ description: 'The image url for the background of the organization.', nullable: true })
    @IsOptional()
    readonly backgroundUrl?: string;

    @IsUrl()
    @ValidateIf((object, value) => value !== null)
    @Field({ description: 'The url for the website associated with this organization', nullable: true })
    @IsOptional()
    readonly websiteUrl?: string;

    @IsString()
    @ValidateIf((object, value) => value !== null)
    @Field({ description: "The twitter handle associated with this organization, e.g. 'vibe-labs'", nullable: true })
    @IsOptional()
    readonly twitter?: string;

    @IsString()
    @ValidateIf((object, value) => value !== null)
    @Field({ description: "The instagram handle associated with this organization, e.g. 'vibe-labs'", nullable: true })
    @IsOptional()
    readonly instagram?: string;

    @IsString()
    @ValidateIf((object, value) => value !== null)
    @Field({ description: "The discord handle associated with this organization, e.g. 'vibe-labs", nullable: true })
    @IsOptional()
    readonly discord?: string;

    @IsArray()
    @Field((type) => [OrganizationInviteItemInput], { description: 'emails to invite to the org', nullable: true })
    @IsOptional()
    readonly invites?: OrganizationInviteItemInput[];
}

@InputType('OrganizationInviteItemInput')
class OrganizationInviteItemInput {
    @IsString()
    @Field({ description: 'emails to invite to the org.' })
    readonly email: string;

    @IsBoolean()
    @IsOptional()
    @Field({ description: 'canEdit for the membership.' })
    readonly canEdit?: boolean;

    @IsBoolean()
    @IsOptional()
    @Field({ description: 'canDeploy for the membership.' })
    readonly canDeploy?: boolean;

    @IsBoolean()
    @IsOptional()
    @Field({ description: 'canManage for the membership.' })
    readonly canManage?: boolean;
}

@InputType()
export class UpdateOrganizationInput {
    @IsString()
    @Field({ description: 'The id of the organization.' })
    readonly id: string;

    @IsString()
    @Field({ description: 'The unique URL-friendly identifier for a organization.', nullable: true })
    readonly name?: string;

    @IsString()
    @Field({ description: 'The name that we display for the organization.', nullable: true })
    readonly displayName?: string;

    @IsString()
    @ValidateIf((object, value) => value !== null)
    @Field({ description: 'The description for the organization.', nullable: true })
    readonly about?: string;

    @IsUrl()
    @Field({
        description: 'The image url for the avatar of the organization. This is the profile picture.',
        nullable: true,
    })
    readonly avatarUrl?: string;

    @IsUrl()
    @ValidateIf((object, value) => value !== null)
    @Field({ description: 'The image url for the background of the organization.', nullable: true })
    readonly backgroundUrl?: string;

    @IsUrl()
    @ValidateIf((object, value) => value !== null)
    @Field({ description: 'The url for the website associated with this organization', nullable: true })
    readonly websiteUrl?: string;

    @IsString()
    @ValidateIf((object, value) => value !== null)
    @Field({ description: "The twitter handle associated with this organization, e.g. 'vibe-labs'", nullable: true })
    readonly twitter?: string;

    @IsString()
    @ValidateIf((object, value) => value !== null)
    @Field({ description: "The instagram handle associated with this organization, e.g. 'vibe-labs'", nullable: true })
    readonly instagram?: string;

    @IsString()
    @ValidateIf((object, value) => value !== null)
    @Field({ description: "The discord handle associated with this organization, e.g. 'vibe-labs", nullable: true })
    readonly discord?: string;
}

@InputType()
export class DeleteOrganizationInput {
    @IsString()
    @Field({ description: 'The id of the organization.' })
    readonly id: string;
}

@InputType()
export class OrganizationInput {
    @IsString()
    @Field({ description: 'The id of the organization.' })
    readonly id: string;
}

@InputType()
export class TransferOrganizationInput {
    @IsString()
    @Field({ description: 'The id of the organization.' })
    readonly id: string;

    @IsString()
    @Field({ description: 'The new ownerId of the organization.' })
    readonly ownerId: string;
}
