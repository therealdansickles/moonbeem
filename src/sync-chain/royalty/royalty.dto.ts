import { ObjectType, Field, ID } from '@nestjs/graphql';
import { IsString, IsDateString, IsNumber } from 'class-validator';

@ObjectType('Royalty')
export class Royalty {
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
    readonly txTime: string;

    @IsString()
    @Field({ description: 'Transaction sender of transaction.' })
    readonly sender: string;

    @IsString()
    @Field({ description: 'The contract address.' })
    readonly address: string;

    @IsString()
    @Field({ description: 'The master contract address.' })
    readonly userAddress: string;

    @IsNumber()
    @Field({ description: 'The chain id for the factory' })
    readonly userRate: number;

    @IsNumber()
    @Field({ description: 'The chain id for the factory' })
    readonly chainId?: number;

    @IsDateString()
    @Field({ description: 'The DateTime that this organization was created(initially created as a draft).' })
    readonly createdAt: Date;

    @IsDateString()
    @Field({ description: 'The DateTime that this organization was last updated.' })
    readonly updatedAt: Date;
}
