import { ObjectType, Field, ID } from '@nestjs/graphql';
import { IsString, IsDateString, IsNumber } from 'class-validator';

@ObjectType('Record721')
export class Record721 {
    @IsString()
    @Field(() => ID)
    readonly id: string;

    @IsNumber()
    @Field({ description: 'Block height of transaction.' })
    readonly height: number;

    @IsString()
    @Field({ description: 'Transaction hash of transaction.' })
    readonly txHash: string;

    @IsString()
    @Field({ description: 'Transaction time of transaction.' })
    readonly txTime: number;

    @IsString()
    @Field({ description: 'The contract address.' })
    readonly address: string;

    @IsString()
    @Field({ description: 'The name of contract.' })
    readonly name: string;

    @IsString()
    @Field({ description: 'The symbol of contract.' })
    readonly symbol: string;

    @IsString()
    @Field({ description: 'The base uri of contract.' })
    readonly baseUri: string;

    @IsString()
    @Field({ description: 'The owner of contract.' })
    readonly owner: string;

    @IsNumber()
    @Field({ description: 'The chain id for the contract.' })
    readonly chainId?: number;

    @IsDateString()
    @Field({ description: 'The DateTime that this contract record was created(initially created as a draft).' })
    readonly createdAt: Date;

    @IsDateString()
    @Field({ description: 'The DateTime that this record was last updated.' })
    readonly updatedAt: Date;
}
