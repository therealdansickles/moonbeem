import { Field, ObjectType, InputType, Int } from '@nestjs/graphql';
import { IsObject, IsNumber, IsString, IsDateString, IsArray } from 'class-validator';
import { Wallet } from '../wallet/wallet.dto';
import { Collection } from '../collection/collection.dto';

@ObjectType('Collaboration')
export class Collaboration {
    @IsString()
    @Field({ description: 'The ID of the collaboration.' })
    readonly id: string;

    @IsObject()
    @Field({ description: 'The wallet of the collaboration.', nullable: true })
    readonly wallet?: Wallet;

    @IsObject()
    @Field({ description: 'The collection of the collaboration.', nullable: true })
    readonly collection?: Collection;

    @IsString()
    @Field({ description: 'The address of the collaboration contract.', nullable: true })
    readonly address?: string;

    @IsArray()
    @Field((type) => [CollaboratorOutput], { description: 'All collaborators of this collaboration', nullable: true })
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

@InputType('CreateCollaborationInput')
export class CreateCollaborationInput {
    @IsString()
    @Field({ description: 'The address of the collaboration contract.', nullable: true })
    readonly address?: string;

    @IsString()
    @Field({ description: 'The wallet of the collaboration.', nullable: true })
    readonly walletId?: string;

    @IsString()
    @Field({ description: 'The collection of the collaboration.', nullable: true })
    readonly collectionId?: string;

    @IsNumber()
    @Field((type) => Int, { description: 'The royalty rate of the collaboration.', nullable: true, defaultValue: 0 })
    readonly royaltyRate?: number;

    @IsArray()
    @Field((type) => [CollaboratorInput], { description: 'All collaborators of this collaboration.', nullable: true })
    readonly collaborators?: CollaboratorInput[];
}

@InputType()
export class CollaboratorInput {
    @IsString()
    @Field({ description: 'The collaborator role of the collaboration.' })
    role: string;

    @IsString()
    @Field({ description: 'The collaborator name of the collaboration.' })
    name: string;

    @IsString()
    @Field({ description: 'The user address of the collaboration.' })
    address: string;

    @IsNumber()
    @Field((type) => Int, { description: 'All collaborators of this collaboration.' })
    rate: number;
}

@ObjectType()
export class CollaboratorOutput {
    @IsString()
    @Field({ description: 'The collaborator role of the collaboration.' })
    role: string;

    @IsString()
    @Field({ description: 'The collaborator name of the collaboration.' })
    name: string;

    @IsString()
    @Field({ description: 'The user address of the collaboration.' })
    address: string;

    @IsNumber()
    @Field((type) => Int, { description: 'The royalty rate of the collaboration.' })
    rate: number;
}
