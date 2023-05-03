import { ArgsType, Field, Int, ObjectType, InputType, ID, PickType } from '@nestjs/graphql';
import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsString, IsDateString, IsEthereumAddress, IsUrl, ValidateIf, IsObject } from 'class-validator';
import { User, UserInput } from '../user/user.dto';
import { Tier } from '../tier/tier.dto';
import { MintSaleTransaction } from '../sync-chain/mint-sale-transaction/mint-sale-transaction.dto';

@ObjectType('Wallet')
export class Wallet {
    @IsString()
    @Field((returns) => ID!, { description: 'The id for a wallet.' })
    readonly id: string;

    @IsEthereumAddress()
    @Field({ description: 'The address for a wallet.' })
    readonly address: string;

    @IsObject()
    @Field(() => User, { description: 'The owner of the wallet.', nullable: true })
    readonly owner?: User;
}

@ObjectType('Minted', { description: 'The NFT minted by a wallet.' })
export class Minted extends PickType(MintSaleTransaction, [
    'address',
    'tokenAddress',
    'paymentToken',
    'tokenId',
    'price',
    'txTime',
] as const) {
    @IsObject()
    @Field(() => Tier, { description: 'The tier of the minted token.' })
    readonly tier: Tier;
}

@ObjectType('EstimatedValue', {
    description: 'The estimated value of a address holdings/minted collections by address',
})
export class EstimatedValue {
    @IsString()
    @Field({ description: 'The estimated value.' })
    readonly estimatedValue: string;
}

@InputType()
export class CreateWalletInput {
    @IsString() // we can use IsEthereumAddress() here, but we want to support EIP-3770 address format.
    @Field({ description: 'The address for a wallet.' })
    readonly address: string;

    @IsString() // we can use IsEthereumAddress() here, but we want to support EIP-3770 address format.
    @Field({ description: 'The id for the owner.', nullable: true })
    readonly ownerId?: string;
}

@InputType('BindWalletInput')
export class BindWalletInput {
    @IsString()
    @Field({ description: 'an ethereum or EIP-3770 address.' })
    readonly address: string;

    @Field({ description: 'The signing message' })
    @IsString()
    readonly message: string;

    @Field({ description: 'The signature from the front-end to verify' })
    @IsString()
    readonly signature: string;

    @IsObject()
    @Field((type) => UserInput, { description: 'the owner uuid of the wallet.' })
    readonly owner: UserInput;
}

@InputType('UnbindWalletInput')
export class UnbindWalletInput {
    @IsString()
    @Field({ description: 'an ethereum or EIP-3770 address.' })
    readonly address: string;

    @IsObject()
    @Field((type) => UserInput, { description: 'the owner uuid of the wallet.' })
    readonly owner: UserInput;
}
