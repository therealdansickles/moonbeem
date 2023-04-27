import { ObjectType, Field, ID } from '@nestjs/graphql';
import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsDateString, IsNumber } from 'class-validator';

@ObjectType('MintSaleTransaction')
export class MintSaleTransaction {
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
    @IsNumber()
    @Field({ description: 'Transaction time of transaction.' })
    readonly txTime: number;

    @ApiProperty()
    @IsString()
    @Field({ description: 'Transaction sender of transaction.' })
    sender: string;

    @ApiProperty()
    @IsString()
    @Field({ description: 'NFT Recipient of current transaction.' })
    recipient: string;

    @ApiProperty()
    @IsString()
    @Field({ description: 'The contract address' })
    readonly address: string;

    @ApiProperty()
    @IsNumber()
    @Field({ description: 'The tier id for the collection.' })
    readonly tierId: number;

    @ApiProperty()
    @IsString()
    @Field({ description: 'Collection associated token contract address, Erc721 contract' })
    tokenAddress: string;

    @ApiProperty()
    @IsString()
    @Field({ description: 'The token id received by the user' })
    tokenId: string;

    @ApiProperty()
    @IsString()
    @Field({ description: 'The tier price' })
    price: string;

    @ApiProperty()
    @IsString()
    @Field({ description: 'The payment token address' })
    paymentToken: string;

    @ApiProperty()
    @IsNumber()
    @Field({ description: 'The chain id for the transaction' })
    readonly chainId?: number;

    @ApiProperty()
    @IsDateString()
    @Field({ description: 'The created time.' })
    readonly createdAt: Date;

    @ApiProperty()
    @IsDateString()
    @Field({ description: 'The DateTime that this transaction was last updated.' })
    readonly updatedAt: Date;
}
