import { ObjectType, Field, ID } from '@nestjs/graphql';
import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsDateString, IsNumber } from 'class-validator';

@ObjectType('Record721')
export class Record721 {
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
    @Field({ description: 'The contract address.' })
    readonly address: string;

    @ApiProperty()
    @IsString()
    @Field({ description: 'The name of contract.' })
    readonly name: string;

    @ApiProperty()
    @IsString()
    @Field({ description: 'The symbol of contract.' })
    readonly symbol: string;

    @ApiProperty()
    @IsString()
    @Field({ description: 'The base uri of contract.' })
    readonly baseUri: string;

    @ApiProperty()
    @IsString()
    @Field({ description: 'The owner of contract.' })
    readonly owner: string;

    @ApiProperty()
    @IsNumber()
    @Field({ description: 'The chain id for the contract.' })
    readonly chainId?: number;

    @ApiProperty()
    @IsDateString()
    @Field({ description: 'The DateTime that this contract record was created(initially created as a draft).' })
    readonly createdAt: Date;

    @ApiProperty()
    @IsDateString()
    @Field({ description: 'The DateTime that this record was last updated.' })
    readonly updatedAt: Date;
}
