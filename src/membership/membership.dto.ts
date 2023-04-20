import { ArgsType, Field, Int, ObjectType, InputType, ID } from '@nestjs/graphql';
import { ApiProperty } from '@nestjs/swagger';
import { IsObject, IsNumber, IsString, IsBoolean, IsDateString, IsUrl, ValidateIf, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';
import { Organization } from '../organization/organization.dto';
import { User } from '../user/user.dto';

@ObjectType('Membership')
export class Membership {
    @ApiProperty()
    @IsString()
    @Field({ description: 'The id of the membership.' })
    readonly id: string;

    @ApiProperty()
    @IsObject()
    @Field({ description: 'The user that is a member of this organization.' })
    readonly user: User;

    @ApiProperty()
    @IsObject()
    @Field({ description: 'The organization that this user is a member of.' })
    readonly organization: Organization;

    @ApiProperty()
    @IsBoolean()
    @Field((returns) => Boolean, { description: 'Whether or not this user can edit.' })
    readonly canEdit: boolean;

    @ApiProperty()
    @IsBoolean()
    @Field((returns) => Boolean, { description: 'Whether or not this user can manage.' })
    readonly canManage: boolean;

    @ApiProperty()
    @IsBoolean()
    @Field((returns) => Boolean, { description: 'Whether or not this user can deploy a collection.' })
    readonly canDeploy: boolean;
}

@InputType()
export class CreateMembershipInput {
    @ApiProperty()
    @IsString()
    @Field({ description: 'The user that is a member of this organization.' })
    readonly userId: string;

    @ApiProperty()
    @IsString()
    @Field({ description: 'The organization that this user is a member of.' })
    readonly organizationId: string;

    @ApiProperty()
    @IsBoolean()
    @Field((returns) => Boolean, { description: 'Whether or not this user can edit.', nullable: true })
    readonly canEdit?: boolean;

    @ApiProperty()
    @IsBoolean()
    @Field((returns) => Boolean, { description: 'Whether or not this user can manage.', nullable: true })
    readonly canManage?: boolean;

    @ApiProperty()
    @IsBoolean()
    @Field((returns) => Boolean, { description: 'Whether or not this user can deploy a collection.', nullable: true })
    readonly canDeploy?: boolean;
}

@InputType()
export class UpdateMembershipInput {
    @ApiProperty()
    @IsString()
    @Field({ description: 'The id for a membership.' })
    readonly id: string;

    @ApiProperty()
    @IsBoolean()
    @Field((returns) => Boolean, { description: 'Whether or not this user can edit.', nullable: true })
    readonly canEdit?: boolean;

    @ApiProperty()
    @IsBoolean()
    @Field((returns) => Boolean, { description: 'Whether or not this user can manage.', nullable: true })
    readonly canManage?: boolean;

    @ApiProperty()
    @IsBoolean()
    @Field((returns) => Boolean, { description: 'Whether or not this user can deploy a collection.', nullable: true })
    readonly canDeploy?: boolean;
}

@InputType()
export class DeleteMembershipInput {
    @ApiProperty()
    @IsString()
    @Field({ description: 'The id for a membership.' })
    readonly id: string;
}
