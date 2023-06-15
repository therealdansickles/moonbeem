import { Field, ObjectType, InputType } from '@nestjs/graphql';
import { IsObject, IsString, IsBoolean, IsOptional } from 'class-validator';
import { Organization } from '../organization/organization.dto';
import { User } from '../user/user.dto';

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
}

@InputType()
export class MembershipRequestInput {
    @IsString()
    @Field({ description: 'The user that is a member of this organization.' })
    readonly userId: string;

    @IsString()
    @Field({ description: 'The organization that this user is a member of.' })
    readonly organizationId: string;

    @IsString()
    @Field({ description: 'The unique user invite code for the membership' })
    readonly inviteCode: string;
}

@InputType()
export class CreateMembershipInput {
    @IsString()
    @Field({ description: 'The user that is a member of this organization.', nullable: true })
    @IsOptional()
    readonly userId?: string;

    @IsString()
    @Field({ description: 'The email of the user', nullable: true })
    @IsOptional()
    readonly email?: string;

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
}

@InputType()
export class UpdateMembershipInput {
    @IsString()
    @Field({ description: 'The id for a membership.' })
    readonly id: string;

    @IsBoolean()
    @Field(() => Boolean, { description: 'Whether or not this user can edit.', nullable: true })
    readonly canEdit?: boolean;

    @IsBoolean()
    @Field(() => Boolean, { description: 'Whether or not this user can manage.', nullable: true })
    readonly canManage?: boolean;

    @IsBoolean()
    @Field(() => Boolean, { description: 'Whether or not this user can deploy a collection.', nullable: true })
    readonly canDeploy?: boolean;
}

@InputType()
export class DeleteMembershipInput {
    @IsString()
    @Field({ description: 'The id for a membership.' })
    readonly id: string;
}
