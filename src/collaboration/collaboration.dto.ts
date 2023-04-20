import { Field, ObjectType, InputType } from '@nestjs/graphql';
import { ApiProperty } from '@nestjs/swagger';
import { IsObject, IsNumber, IsString, IsDateString } from 'class-validator';
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
    @IsString()
    @Field({ description: 'The address of the collaboration factory.', nullable: true })
    readonly factoryAddress?: string;

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
    @Field({ description: 'The address of the collaboration factory.', nullable: true })
    readonly factoryAddress?: string;

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
    @Field({ description: 'The royalty rate of the collaboration.' })
    readonly royaltyRate: number;
}
