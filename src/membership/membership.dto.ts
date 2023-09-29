import { Field, InputType, ObjectType } from '@nestjs/graphql';
import { IsArray, IsBoolean, IsObject, IsOptional, IsString } from 'class-validator';
import { Organization } from '../organization/organization.dto';
import { Organization as OrganizationEntity } from '../organization/organization.entity';
import { User } from '../user/user.dto';
import { Roles } from './membership.constant';

@ObjectType('Membership')
export class Membership {
    @IsString()
    @Field({ description: 'The id of the membership.' })
    readonly id: string;

    @IsObject()
    @Field({ description: 'The user invited to this membership', nullable: true })
    readonly user?: User;

    @IsString()
    @Field({ description: 'The email of the user invited to this membership', nullable: true })
    readonly email?: string;

    @IsObject()
    @Field({ description: 'The organization that this membership is for' })
    readonly organization: Organization;

    @IsBoolean()
    @Field(() => Boolean, { description: 'Whether or not this user can edit.' })
    readonly canEdit: boolean;

    @IsBoolean()
    @Field(() => Boolean, { description: 'Whether or not this user can manage.' })
    readonly canManage: boolean;

    @IsBoolean()
    @Field(() => Boolean, { description: 'Whether or not this user can deploy a collection.' })
    readonly canDeploy: boolean;

    @IsString()
    @IsOptional()
    @Field(() => String, { description: 'The role for this membership.', nullable: true })
    readonly role: string;
}

@InputType()
export class MembershipRequestInput {
    @IsString()
    @Field({ description: 'The email of the user that is a member of this organization.' })
    readonly email: string;

    @IsString()
    @Field({ description: 'The organization that this user is a member of.' })
    readonly organizationId: string;

    @IsString()
    @Field({ description: 'The unique user invite code for the membership' })
    readonly inviteCode: string;
}

@InputType()
export class CreateMembershipInput {
    @IsArray()
    @Field(() => [String], { description: 'The email of the user', nullable: true })
    @IsOptional()
    readonly emails?: string[];

    @IsString()
    @Field({ description: 'The organization that this user is a member of.' })
    readonly organizationId: string;

    @IsBoolean()
    @Field(() => Boolean, { description: 'Whether or not this user can edit.', nullable: true })
    @IsOptional()
    readonly canEdit?: boolean;

    @IsBoolean()
    @Field(() => Boolean, { description: 'Whether or not this user can manage.', nullable: true })
    @IsOptional()
    readonly canManage?: boolean;

    @IsBoolean()
    @Field(() => Boolean, { description: 'Whether or not this user can deploy a collection.', nullable: true })
    @IsOptional()
    readonly canDeploy?: boolean;

    @IsString()
    @Field({ defaultValue: Roles.Member, description: 'The role for this membership.', nullable: true })
    readonly role?: string;
}

@InputType()
export class UpdateMembershipInput {
    @IsString()
    @Field({ description: 'The id for a membership.' })
    readonly id: string;

    @IsBoolean()
    @IsOptional()
    @Field(() => Boolean, { description: 'Whether or not this user can edit.', nullable: true })
    readonly canEdit?: boolean;

    @IsBoolean()
    @IsOptional()
    @Field(() => Boolean, { description: 'Whether or not this user can manage.', nullable: true })
    readonly canManage?: boolean;

    @IsBoolean()
    @IsOptional()
    @Field(() => Boolean, { description: 'Whether or not this user can deploy a collection.', nullable: true })
    readonly canDeploy?: boolean;

    @IsString()
    @IsOptional()
    @Field(() => String, { description: 'The role for this membership.', nullable: true })
    readonly role?: string;
}

@InputType()
export class DeleteMembershipInput {
    @IsString()
    @Field({ description: 'The id for a membership.' })
    readonly id: string;
}

export interface ICreateMembership {
    organization: OrganizationEntity;
    canEdit?: boolean;
    canManage?: boolean;
    canDeploy?: boolean;
    role?: string;
}
