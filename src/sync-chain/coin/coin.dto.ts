import { ObjectType, Field, ID } from '@nestjs/graphql';
import { IsString, IsDateString, IsNumber, IsBoolean } from 'class-validator';

@ObjectType()
export class CoinQuote {
    @IsNumber()
    @Field({ description: 'Converted price in terms of the quoted currency and historic time (if supplied).' })
    readonly price: number;
}

export class CoinQuotes {
    readonly [key: string]: CoinQuote;
}

@ObjectType('Coin')
export class Coin {
    @IsString()
    @Field(() => ID)
    readonly id: string;

    @IsString()
    @Field({ description: 'The coin address.' })
    readonly address: string;

    @IsNumber()
    @Field({ description: 'The name of coin.' })
    readonly name: string;

    @IsString()
    @Field({ description: 'The symbol of coin.' })
    readonly symbol: string;

    @IsString()
    @Field({ description: 'The decimals of coin.' })
    readonly decimals: number;

    // It will be deleted after the frontend has finished integrating
    @IsString()
    @Field({ description: '(Deprecated) Price of tokens converted to ETH. Required decimals are 18' })
    readonly derivedETH?: string;

    // It will be deleted after the frontend has finished integrating
    @IsString()
    @Field({ description: '(Deprecated) Price of tokens converted to USDC. Required decimals are 18' })
    readonly derivedUSDC?: string;

    @IsBoolean()
    @Field({ description: 'Is this token address a native token' })
    readonly native: boolean;

    @IsBoolean()
    @Field({ description: 'Whether this token is open for use' })
    readonly enable: boolean;

    @IsNumber()
    @Field({ description: 'The chain id for the coin.' })
    readonly chainId?: number;

    @IsDateString()
    @Field({ description: 'The created time.' })
    readonly createdAt: Date;

    @IsDateString()
    @Field({ description: 'The DateTime that this coin was last updated.' })
    readonly updatedAt: Date;
}
