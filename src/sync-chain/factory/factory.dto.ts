import { ObjectType, Field, ID, InputType, registerEnumType } from '@nestjs/graphql';
import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsDateString, IsNumber, IsOptional } from 'class-validator';
import { ContractType } from './factory.entity';

registerEnumType(ContractType, { name: 'ContractType' });

@ObjectType('Factory')
export class Factory {
    @ApiProperty()
    @IsString()
    @Field((returns) => ID!)
    readonly id: string;

    @ApiProperty()
    @IsNumber()
    @Field({ description: 'Block height of transaction.' })
    readonly height: number;

    @ApiProperty()
    @IsString()
    @Field({ description: 'Transaction hash of transaction.' })
    readonly txHash: string;

    @ApiProperty()
    @IsString()
    @Field({ description: 'Transaction time of transaction.' })
    readonly txTime: number;

    @ApiProperty()
    @IsString()
    @Field({ description: 'Transaction sender of transaction.' })
    readonly sender: string;

    @ApiProperty()
    @IsString()
    @Field({ description: 'The contract address.' })
    readonly address: string;

    @ApiProperty()
    @IsString()
    @Field({ description: 'The master contract address.' })
    readonly masterAddress: string;

    @ApiProperty()
    @Field((type) => ContractType, { description: 'The type of Contract.' })
    readonly kind?: ContractType;

    @ApiProperty()
    @IsNumber()
    @Field({ description: 'The chain id for the factory' })
    readonly chainId?: number;

    @ApiProperty()
    @IsDateString()
    @Field({ description: 'The DateTime that this organization was created(initially created as a draft).' })
    readonly createdAt: Date;

    @ApiProperty()
    @IsDateString()
    @Field({ description: 'The DateTime that this organization was last updated.' })
    readonly updatedAt: Date;
}

@InputType()
export class GetFactoriesInput {
    @ApiProperty()
    @IsString()
    @Field({ description: 'The unique URL-friendly identifier for a collection.', nullable: true })
    @IsOptional()
    readonly chainId?: number;
}
