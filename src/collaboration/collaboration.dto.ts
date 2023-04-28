import { Field, ObjectType, InputType, Int } from '@nestjs/graphql';
import { ApiProperty } from '@nestjs/swagger';
import { IsObject, IsNumber, IsString, IsDateString, IsArray } from 'class-validator';
import { Wallet } from '../wallet/wallet.dto';
import { Collection } from '../collection/collection.dto';

@ObjectType('Collaboration')
export class Collaboration {
    @ApiProperty()
    @IsString()
    @Field({ description: 'The ID of the collaboration.' })
    readonly id: string;

    @ApiProperty()
    @IsObject()
    @Field({ description: 'The wallet of the collaboration.' })
    readonly wallet: Wallet;

    @ApiProperty()
    @IsObject()
    @Field({ description: 'The collection of the collaboration.' })
    readonly collection: Collection;

    @ApiProperty()
    @IsString()
    @Field({ description: 'The address of the collaboration contract.', nullable: true })
    readonly address?: string;

    @ApiProperty()
    @IsArray()
    @Field((type) => [CollaboratorOutput], { description: 'All collaborators of this collaboration' })
    readonly collaborators?: CollaboratorOutput[];

    @ApiProperty()
    @IsNumber()
    @Field({ description: 'The royalty rate of the collaboration.' })
    readonly royaltyRate: number;

    @ApiProperty()
    @IsDateString()
    @Field({ description: 'The created datetime of the collaboration.' })
    readonly createdAt: Date;

    @ApiProperty()
    @IsDateString()
    @Field({ description: 'The updated datetime of the collaboration.' })
    readonly updatedAt: Date;
}

@InputType('CreateCollaborationInput')
export class CreateCollaborationInput {
    @ApiProperty()
    @IsString()
    @Field({ description: 'The address of the collaboration contract.', nullable: true })
    readonly address?: string;

    @ApiProperty()
    @IsString()
    @Field({ description: 'The wallet of the collaboration.' })
    readonly walletId: string;

    @ApiProperty()
    @IsString()
    @Field({ description: 'The collection of the collaboration.' })
    readonly collectionId: string;

    @ApiProperty()
    @IsNumber()
    @Field((type) => Int, { description: 'The royalty rate of the collaboration.' })
    readonly royaltyRate: number;

    @ApiProperty()
    @IsArray()
    @Field((type) => [CollaboratorInput], { description: 'All collaborators of this collaboration.' })
    readonly collaborators?: CollaboratorInput[];
}

@InputType()
export class CollaboratorInput {
    @ApiProperty()
    @IsString()
    @Field({ description: 'The collaborator role of the collaboration.' })
    role: string;

    @ApiProperty()
    @IsString()
    @Field({ description: 'The collaborator name of the collaboration.' })
    name: string;

    @ApiProperty()
    @IsString()
    @Field({ description: 'The user address of the collaboration.' })
    address: string;

    @ApiProperty()
    @IsNumber()
    @Field((type) => Int, { description: 'All collaborators of this collaboration.' })
    rate: number;
}

@ObjectType()
export class CollaboratorOutput {
    @ApiProperty()
    @IsString()
    @Field({ description: 'The collaborator role of the collaboration.' })
    role: string;

    @ApiProperty()
    @IsString()
    @Field({ description: 'The collaborator name of the collaboration.' })
    name: string;

    @ApiProperty()
    @IsString()
    @Field({ description: 'The user address of the collaboration.' })
    address: string;

    @ApiProperty()
    @IsNumber()
    @Field((type) => Int, { description: 'The royalty rate of the collaboration.' })
    rate: number;
}
