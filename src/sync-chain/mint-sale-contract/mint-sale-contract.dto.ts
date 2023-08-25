import { ObjectType, Field, ID, registerEnumType } from '@nestjs/graphql';
import { IsString, IsDateString, IsNumber, IsBoolean } from 'class-validator';
import { ContractType } from '../factory/factory.entity';

registerEnumType(ContractType, { name: 'ContractType' });

@ObjectType('MintSaleContract')
export class MintSaleContract {
    @IsString()
    @Field(() => ID)
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
    readonly sender: string;

    @IsString()
    @Field({ description: 'The contract address.' })
    readonly address: string;

    @IsString()
    @Field({ description: 'The royalty contract of MintSale' })
    readonly royaltyReceiver: string;

    @IsNumber()
    @Field({ description: 'The royalty rate of MintSale' })
    readonly royaltyRate: number;

    @IsNumber()
    @Field({ description: 'The derivative royalty rate of MintSale' })
    readonly derivativeRoyaltyRate: number;

    @IsBoolean()
    @Field({ description: 'Means whether this nft supports derivative royalty' })
    readonly isDerivativeAllowed: boolean;

    @IsNumber()
    @Field({ description: 'The begin time of the MintSale' })
    readonly beginTime: number;

    @IsNumber()
    @Field({ description: 'The end time of the MintSale' })
    readonly endTime: number;

    @IsNumber()
    @Field({ description: 'The tier id of the MintSale' })
    readonly tierId: number;

    @IsString()
    @Field({ description: 'The price of the tier' })
    readonly price: string;

    @IsString()
    @Field({ description: 'The payment token of the collection' })
    readonly paymentToken: string;

    @IsNumber()
    @Field({ description: 'The start id of the tier' })
    readonly startId: number;

    @IsNumber()
    @Field({ description: 'The end id of the tier' })
    readonly endId: number;

    @IsNumber()
    @Field({ description: 'The current id of the tier' })
    readonly currentId: number;

    @IsString()
    @Field({ description: 'The token address(erc721 address) of the collection' })
    readonly tokenAddress: string;

    @Field(() => ContractType, { description: 'The type of Contract.' })
    readonly kind?: ContractType;

    @IsNumber()
    @Field({ description: 'The chain id for the transaction' })
    readonly chainId?: number;

    @IsNumber()
    @Field({ description: 'The collection address for the transaction' })
    readonly collectionId?: string;

    @IsDateString()
    @Field({ description: 'The DateTime of create.' })
    readonly createdAt: Date;

    @IsDateString()
    @Field({ description: 'The DateTime that this contract was last updated.' })
    readonly updatedAt: Date;
}
