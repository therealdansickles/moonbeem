import { ObjectType, Field, ID, registerEnumType } from '@nestjs/graphql';
import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsDateString, IsNumber, IsBoolean } from 'class-validator';
import { ContractType } from '../factory/factory.entity';

registerEnumType(ContractType, { name: 'ContractType' });

@ObjectType('MintSaleContract')
export class MintSaleContract {
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
    @IsNumber()
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
    @Field({ description: 'The royalty contract of MintSale' })
    readonly royaltyReceiver: string;

    @ApiProperty()
    @IsNumber()
    @Field({ description: 'The royalty rate of MintSale' })
    readonly royaltyRate: number;

    @ApiProperty()
    @IsNumber()
    @Field({ description: 'The derivative royalty rate of MintSale' })
    readonly derivativeRoyaltyRate: number;

    @ApiProperty()
    @IsBoolean()
    @Field({ description: 'Means whether this nft supports derivative royalty' })
    readonly isDerivativeAllowed: boolean;

    @ApiProperty()
    @IsNumber()
    @Field({ description: 'The begin time of the MintSale' })
    readonly beginTime: number;

    @ApiProperty()
    @IsNumber()
    @Field({ description: 'The end time of the MintSale' })
    readonly endTime: number;

    @ApiProperty()
    @IsNumber()
    @Field({ description: 'The tier id of the MintSale' })
    readonly tierId: number;

    @ApiProperty()
    @IsString()
    @Field({ description: 'The price of the tier' })
    readonly price: string;

    @ApiProperty()
    @IsString()
    @Field({ description: 'The payment token of the collection' })
    readonly paymentToken: string;

    @ApiProperty()
    @IsNumber()
    @Field({ description: 'The start id of the tier' })
    readonly startId: number;

    @ApiProperty()
    @IsNumber()
    @Field({ description: 'The end id of the tier' })
    readonly endId: number;

    @ApiProperty()
    @IsNumber()
    @Field({ description: 'The current id of the tier' })
    readonly currentId: number;

    @ApiProperty()
    @IsString()
    @Field({ description: 'The token address(erc721 address) of the collection' })
    readonly tokenAddress: string;

    @ApiProperty()
    @Field(() => ContractType, { description: 'The type of Contract.' })
    readonly kind?: ContractType;

    @ApiProperty()
    @IsNumber()
    @Field({ description: 'The chain id for the transaction' })
    readonly chainId?: number;

    @ApiProperty()
    @IsNumber()
    @Field({ description: 'The collection address for the transaction' })
    readonly collectionId?: string;

    @ApiProperty()
    @IsDateString()
    @Field({ description: 'The DateTime of create.' })
    readonly createdAt: Date;

    @ApiProperty()
    @IsDateString()
    @Field({ description: 'The DateTime that this contract was last updated.' })
    readonly updatedAt: Date;
}
