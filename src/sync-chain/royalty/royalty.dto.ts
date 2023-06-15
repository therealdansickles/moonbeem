import { ObjectType, Field, ID } from '@nestjs/graphql';
import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsDateString, IsNumber } from 'class-validator';

@ObjectType('Royalty')
export class Royalty {
    @ApiProperty()
    @IsString()
    @Field(() => ID)
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
    readonly txTime: string;

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
    readonly userAddress: string;

    @ApiProperty()
    @IsNumber()
    @Field({ description: 'The chain id for the factory' })
    readonly userRate: number;

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
