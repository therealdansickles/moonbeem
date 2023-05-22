import { Field, ObjectType, InputType, ID, OmitType, PartialType, PickType, registerEnumType } from '@nestjs/graphql';
import { IsString, IsEthereumAddress, IsObject, IsOptional, IsEnum } from 'class-validator';
import { User, UserInput } from '../user/user.dto';
import { Tier } from '../tier/tier.dto';
import { MintSaleTransaction } from '../sync-chain/mint-sale-transaction/mint-sale-transaction.dto';

@ObjectType('Wallet')
export class Wallet {
    @IsString()
    @Field(() => ID!, { description: 'The id for a wallet.' })
    readonly id: string;

    @Field({ description: 'The address for a wallet.' })
    @IsEthereumAddress()
    readonly address: string;

    @Field(() => User, { description: 'The owner of the wallet.', nullable: true })
    @IsObject()
    @IsOptional()
    readonly owner?: User;

    @Field({ nullable: true, description: 'The name for the wallet.' })
    @IsString()
    @IsOptional()
    name?: string;

    @Field({ nullable: true, description: "The URL pointing to the wallet's avatar." })
    @IsString()
    @IsOptional()
    readonly avatarUrl?: string;

    @Field({ description: "The url of the user's website.", nullable: true })
    @IsString()
    @IsOptional()
    readonly websiteUrl?: string;

    @Field({ nullable: true, description: 'The description for the wallet.' })
    @IsString()
    @IsOptional()
    readonly about?: string;

    @Field({ nullable: true, description: 'The twitter handle for the wallet.' })
    @IsString()
    @IsOptional()
    readonly twitter?: string;

    @Field({ nullable: true, description: 'The instagram handle for the wallet.' })
    @IsString()
    @IsOptional()
    readonly instagram?: string;

    @Field({ nullable: true, description: 'The discord handle for the wallet.' })
    @IsString()
    @IsOptional()
    readonly discord?: string;

    @Field({ nullable: true, description: 'The spotify handle for the wallet..' })
    @IsString()
    @IsOptional()
    readonly spotify?: string;
}

@ObjectType('Minted', { description: 'The NFT minted by a wallet.' })
export class Minted extends PickType(MintSaleTransaction, [
    'address',
    'tokenAddress',
    'paymentToken',
    'tokenId',
    'price',
    'txTime',
    'txHash',
    'chainId',
] as const) {
    @IsObject()
    @Field(() => Tier, { description: 'The tier of the minted token.', nullable: true })
    readonly tier: Tier;
}

export enum ActivityType {
    Mint = 'Mint',
    Deploy = 'Deploy',
}

registerEnumType(ActivityType, {
    name: 'ActivityType',
});

@ObjectType('Activity', { description: 'The activity for a wallet.' })
export class Activity extends PartialType(
    PickType(MintSaleTransaction, [
        'address',
        'tokenAddress',
        'paymentToken',
        'tokenId',
        'price',
        'txTime',
        'txHash',
        'chainId',
    ] as const)
) {
    @IsObject()
    @Field(() => Tier, { description: 'The tier of the minted token.', nullable: true })
    readonly tier: Tier;

    @IsEnum(ActivityType)
    @Field(() => ActivityType, { description: 'The activity type.' })
    readonly type: ActivityType;
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

@InputType('CreateWalletInput')
export class CreateWalletInput extends OmitType(Wallet, ['id', 'owner'], InputType) {
    @IsString()
    @Field({ description: 'The id for the owner.', nullable: true })
    readonly ownerId?: string;
}

@InputType('UpdateWalletInput')
export class UpdateWalletInput extends PartialType(OmitType(Wallet, ['owner'], InputType)) {
    @IsString()
    @Field({ description: 'The id for the owner.', nullable: true })
    @IsOptional()
    readonly ownerId?: string;
}

@InputType('BindWalletInput')
// export class BindWalletInput extends PickType(Wallet, ['address'] as const) {
export class BindWalletInput {
    @Field({ description: 'The address for a wallet.' })
    @IsEthereumAddress()
    readonly address: string;

    @Field({ description: 'The signing message' })
    @IsString()
    readonly message: string;

    @Field({ description: 'The signature from the front-end to verify' })
    @IsString()
    readonly signature: string;

    @IsObject()
    @Field(() => UserInput, { description: 'the owner uuid of the wallet.' })
    readonly owner: UserInput;
}

@InputType('UnbindWalletInput')
// export class UnbindWalletInput extends PickType(Wallet, ['address'] as const) {
export class UnbindWalletInput {
    @Field({ description: 'The address for a wallet.' })
    @IsEthereumAddress()
    readonly address: string;

    @IsObject()
    @Field(() => UserInput, { description: 'the owner uuid of the wallet.' })
    readonly owner: UserInput;
}

@InputType('WalletInput')
export class WalletInput {
    @IsString()
    @Field(() => ID!)
    readonly id: string;
}
