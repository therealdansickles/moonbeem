import { ArgsType, Field, Int, ObjectType, InputType, ID, PickType } from '@nestjs/graphql';
import { ApiProperty } from '@nestjs/swagger';
import {
    IsNumber,
    IsString,
    IsDateString,
    IsEthereumAddress,
    IsUrl,
    ValidateIf,
    IsObject,
    IsOptional,
} from 'class-validator';
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

    @IsString()
    @Field({ nullable: true, description: 'The name for the wallet.' })
    @IsOptional()
    name?: string;

    @IsString()
    @Field({ nullable: true, description: "The URL pointing to the wallet's avatar." })
    @IsOptional()
    avatarUrl?: string;

    @IsString()
    @Field({ nullable: true, description: 'The description for the wallet.' })
    @IsOptional()
    about?: string;

    @IsString()
    @Field({ nullable: true, description: 'The twitter handle for the wallet.' })
    @IsOptional()
    twitter?: string;

    @IsString()
    @Field({ nullable: true, description: 'The instagram handle for the wallet.' })
    @IsOptional()
    instagram?: string;

    @IsString()
    @Field({ nullable: true, description: 'The discord handle for the wallet.' })
    @IsOptional()
    discord?: string;

    @IsString()
    @Field({ nullable: true, description: 'The spotify handle for the wallet..' })
    @IsOptional()
    spotify?: string;
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

@ObjectType('Activity', { description: 'The activity for a wallet.' })
export class Activity extends PickType(MintSaleTransaction, [
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

    // TODO: make it as enum later
    @IsString()
    @Field({ description: 'The activity type.' })
    readonly type: string;
}

@ObjectType('EstimatedValue', {
    description: 'The estimated value of a address holdings/minted collections by address',
})
export class EstimatedValue {
    @IsString()
    @Field({ description: 'the payment token used' })
    readonly paymentTokenAddress: string;

    @IsString()
    @Field({ description: 'The estimated value.' })
    readonly total: string;

    @IsString()
    @Field({ description: 'The estimated value in USDC.', nullable: true })
    @IsOptional()
    readonly totalUSDC?: string;
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

@InputType('UpdateWalletInput')
export class UpdateWalletInput {
    @IsString()
    @Field({ description: 'The id for the wallet.' })
    id: string;

    @IsString()
    @Field({ nullable: true, description: 'The name for the wallet.' })
    @IsOptional()
    name?: string;

    @IsString()
    @Field({ nullable: true, description: "The URL pointing to the wallet's avatar." })
    @IsOptional()
    avatarUrl?: string;

    @IsString()
    @Field({ nullable: true, description: 'The description for the wallet.' })
    @IsOptional()
    about?: string;

    @IsString()
    @Field({ nullable: true, description: 'The twitter handle for the wallet.' })
    @IsOptional()
    twitter?: string;

    @IsString()
    @Field({ nullable: true, description: 'The instagram handle for the wallet.' })
    @IsOptional()
    instagram?: string;

    @IsString()
    @Field({ nullable: true, description: 'The discord handle for the wallet.' })
    @IsOptional()
    discord?: string;

    @IsString()
    @Field({ nullable: true, description: 'The spotify handle for the wallet..' })
    @IsOptional()
    spotify?: string;
}

@InputType('WalletInput')
export class WalletInput {
    @IsString()
    @Field((returns) => ID!)
    id: string;
}
