import { ObjectType, Field, ID } from '@nestjs/graphql';
import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsDateString, IsNumber, IsBoolean } from 'class-validator';

@ObjectType('Coin')
export class Coin {
    @ApiProperty()
    @IsString()
    @Field(() => ID)
    readonly id: string;

    @ApiProperty()
    @IsString()
    @Field({ description: 'The coin address.' })
    readonly address: string;

    @ApiProperty()
    @IsNumber()
    @Field({ description: 'The name of coin.' })
    readonly name: string;

    @ApiProperty()
    @IsString()
    @Field({ description: 'The symbol of coin.' })
    readonly symbol: string;

    @ApiProperty()
    @IsString()
    @Field({ description: 'The decimals of coin.' })
    readonly decimals: number;

    @ApiProperty()
    @IsString()
    @Field({ description: 'Price of tokens converted to ETH. Required decimals are 18' })
    readonly derivedETH: string;

    @ApiProperty()
    @IsString()
    @Field({ description: 'Price of tokens converted to USDC. Required decimals are 18' })
    readonly derivedUSDC: string;

    @ApiProperty()
    @IsBoolean()
    @Field({ description: 'Is this token address a native token' })
    readonly native: boolean;

    @ApiProperty()
    @IsBoolean()
    @Field({ description: 'Whether this token is open for use' })
    readonly enable: boolean;

    @ApiProperty()
    @IsNumber()
    @Field({ description: 'The chain id for the coin.' })
    readonly chainId?: number;

    @ApiProperty()
    @IsDateString()
    @Field({ description: 'The created time.' })
    readonly createdAt: Date;

    @ApiProperty()
    @IsDateString()
    @Field({ description: 'The DateTime that this coin was last updated.' })
    readonly updatedAt: Date;
}
