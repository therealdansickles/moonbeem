import { Field, ObjectType, InputType, Int, PickType, OmitType, PartialType, Float } from '@nestjs/graphql';
import { IsObject, IsNumber, IsString, IsDateString, IsArray, IsOptional } from 'class-validator';
import { Wallet } from '../wallet/wallet.dto';
import { Collection } from '../collection/collection.dto';
import { User } from '../user/user.dto';
import { Organization } from '../organization/organization.dto';

@ObjectType()
export class CollaboratorOutput {
    @IsString()
    @Field({ description: 'The collaborator role of the collaboration.' })
    readonly role: string;

    @IsString()
    @Field({ description: 'The collaborator name of the collaboration.' })
    readonly name: string;

    @IsString()
    @Field({ description: 'The user address of the collaboration.' })
    readonly address: string;

    @IsNumber()
    @Field(() => Int, { description: 'The royalty rate of the collaboration.' })
    readonly rate: number;
}

@InputType()
export class CollaboratorInput extends OmitType(CollaboratorOutput, [], InputType) {}

@ObjectType()
export class Collaboration {
    @IsString()
    @Field({ description: 'The ID of the collaboration.' })
    readonly id: string;

    @IsString()
    @Field({ description: 'The template name of this collaboration.', nullable: true })
    readonly name?: string;

    @IsObject()
    @Field(() => Wallet, { description: 'The wallet of the collaboration.', nullable: true })
    readonly wallet?: Partial<Wallet>;

    @IsArray()
    @Field(() => [Collection], { description: 'The collections of the collaboration.', nullable: 'itemsAndList' })
    readonly collections?: Collection[];

    @IsString()
    @Field({ description: 'The address of the collaboration contract.', nullable: true })
    readonly address?: string;

    @IsObject()
    @Field(() => User, { description: 'The user of the collaboration.', nullable: true })
    readonly user?: Partial<User>;

    @IsObject()
    @Field(() => Organization, { description: 'The organization of the collaboration.', nullable: true })
    readonly organization?: Partial<Organization>;

    @IsArray()
    @Field(() => [CollaboratorOutput], { description: 'All collaborators of this collaboration.', nullable: true })
    readonly collaborators?: CollaboratorOutput[];

    @IsNumber()
    @Field({ description: 'The royalty rate of the collaboration.', nullable: true })
    readonly royaltyRate?: number;

    @IsDateString()
    @Field({ description: 'The created datetime of the collaboration.' })
    readonly createdAt: Date;

    @IsDateString()
    @Field({ description: 'The updated datetime of the collaboration.' })
    readonly updatedAt: Date;
}

@InputType()
export class CreateCollaborationInput extends OmitType(PartialType(Collaboration, InputType), [
    'id',
    'createdAt',
    'updatedAt',
    'wallet',
    'collections',
    'user',
    'organization',
    'collaborators',
]) {
    @IsString()
    @IsOptional()
    @Field({ nullable: true })
    readonly name?: string;

    @IsString()
    @IsOptional()
    @Field({ nullable: true })
    readonly walletId?: string;

    @IsString()
    @IsOptional()
    @Field({ nullable: true })
    readonly userId?: string;

    @IsString()
    @IsOptional()
    @Field({ nullable: true })
    readonly organizationId?: string;

    @IsArray()
    @Field(() => [CollaboratorInput], { description: 'All collaborators of this collaboration', nullable: true })
    readonly collaborators?: CollaboratorInput[];
}

@InputType()
export class CollaborationInput extends PickType(Collaboration, ['id'], InputType) {}

@ObjectType()
export class CollaboratorEarningsOutput extends CollaboratorOutput {
    @IsNumber()
    @Field(() => Float, { description: 'The earnings of the collaborator.' })
    readonly earnings: number;
}

// Separate ObjectType for the modified collaboration data, which includes earnings
// Necessary to avoid altering the existing Collaboration ObjectType
@ObjectType()
export class CollaborationWithEarnings extends OmitType(Collaboration, ['collaborators'] as const) {
    @IsArray()
    @Field(() => [CollaboratorEarningsOutput], { description: 'All collaborators of this collaboration.', nullable: true })
    readonly collaborators?: CollaboratorEarningsOutput[];
    @IsNumber()
    @Field(() => Float, { description: 'Collaboration total earnings.' })
    readonly totalEarnings: number;
}
