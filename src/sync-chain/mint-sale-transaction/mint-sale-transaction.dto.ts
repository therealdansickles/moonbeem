import { ObjectType, Field, ID, Int } from '@nestjs/graphql';
import { IsString, IsDateString, IsNumber, isNumberString, IsNumberString, IsEthereumAddress } from 'class-validator';
import { EthereumAddress } from '../../lib/scalars/eth.scalar';

@ObjectType('MintSaleTransaction')
export class MintSaleTransaction {
    @IsString()
    @Field((returns) => ID!)
    readonly id: string;

    @IsNumber()
    @Field({ description: 'Block height of transaction.' })
    readonly height: number;

    @IsString()
    @Field({ description: 'Transaction hash of transaction.' })
    readonly txHash: string;

    @IsNumber()
    @Field({ description: 'Transaction time of transaction.' })
    readonly txTime: number;

    @IsString()
    @Field({ description: 'Transaction sender of transaction.' })
    sender: string;

    @IsString()
    @Field({ description: 'NFT Recipient of current transaction.' })
    recipient: string;

    @IsString()
    @Field({ description: 'The contract address' })
    readonly address: string;

    @IsNumber()
    @Field({ description: 'The tier id for the collection.' })
    readonly tierId: number;

    @IsString()
    @Field({ description: 'Collection associated token contract address, Erc721 contract' })
    tokenAddress: string;

    @IsString()
    @Field({ description: 'The token id received by the user' })
    tokenId: string;

    @IsString()
    @Field({ description: 'The tier price' })
    price: string;

    @IsString()
    @Field({ description: 'The payment token address' })
    paymentToken: string;

    @IsNumber()
    @Field({ description: 'The chain id for the transaction' })
    readonly chainId?: number;

    @IsDateString()
    @Field({ description: 'The created time.' })
    readonly createdAt: Date;

    @IsDateString()
    @Field({ description: 'The DateTime that this transaction was last updated.' })
    readonly updatedAt: Date;
}

@ObjectType()
export class LeaderboardRanking {
    @IsNumber()
    @Field((type) => Int, { description: 'Ranking of this leaderboard' })
    readonly rank: number;

    @IsNumberString()
    @Field({ description: 'return price' })
    readonly amount: string;

    @IsNumber()
    @Field((type) => Int, { description: 'Total number of buy' })
    readonly item: number;

    @Field(() => EthereumAddress, { description: 'The user address' })
    @IsEthereumAddress()
    readonly address: string;

    @Field(() => EthereumAddress, { description: 'The payment token address' })
    @IsEthereumAddress()
    readonly paymentToken: string;
}
