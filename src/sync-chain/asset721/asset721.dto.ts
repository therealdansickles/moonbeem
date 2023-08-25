import { ObjectType, Field, ID } from '@nestjs/graphql';
import { IsString, IsDateString, IsNumber } from 'class-validator';

@ObjectType('Asset721')
export class Asset721 {
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
    @Field({ description: 'The token id of contract.' })
    readonly tokenId: string;

    @IsString()
    @Field({ description: 'The owner of token id.' })
    readonly owner: string;

    @IsNumber()
    @Field({ description: 'The chain id for the transaction' })
    readonly chainId?: number;

    @IsDateString()
    @Field({ description: 'The DateTime that this organization was created(initially created as a draft).' })
    readonly createdAt: Date;

    @IsDateString()
    @Field({ description: 'The DateTime that this organization was last updated.' })
    readonly updatedAt: Date;
}
