import {
    Field,
    ObjectType,
    InputType,
    ID,
    OmitType,
    PartialType,
    PickType,
    registerEnumType,
    Int,
} from '@nestjs/graphql';
import {
    IsString,
    IsEthereumAddress,
    IsObject,
    IsOptional,
    IsEnum,
    IsNumber,
    IsArray,
    IsDateString,
    IsNumberString,
} from 'class-validator';
import { User, UserInput } from '../user/user.dto';
import { Tier } from '../tier/tier.dto';
import { MintSaleTransaction } from '../sync-chain/mint-sale-transaction/mint-sale-transaction.dto';
import { Asset721 } from '../sync-chain/asset721/asset721.dto';
import Paginated from '../pagination/pagination.dto';

@ObjectType('Wallet')
export class Wallet {
    @IsString()
    @Field(() => ID, { description: 'The id for a wallet.' })
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
    readonly name?: string;

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
    'id',
    'address',
    'tokenAddress',
    'paymentToken',
    'tokenId',
    'price',
    'txTime',
    'txHash',
    'chainId',
    'createdAt',
] as const) {
    @IsObject()
    @Field(() => Tier, { description: 'The tier of the minted token.', nullable: true })
    readonly tier: Tier;
}

@ObjectType('MintPaginated')
export class MintPaginated extends Paginated(Minted) {}

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
    @Field(() => ID)
    readonly id: string;
}

@ObjectType('WalletOutput')
export class WalletOutput extends OmitType(
    Wallet,
    ['websiteUrl', 'twitter', 'instagram', 'discord', 'spotify', 'owner'],
    ObjectType
) {}

@ObjectType('SearchWallet')
export class SearchWallet {
    @Field(() => Int)
    @IsNumber()
    readonly total: number;

    @Field(() => [WalletOutput])
    @IsArray()
    readonly wallets: WalletOutput[];
}

@ObjectType('CollectionHolderData')
export class CollectionHolderData extends PartialType(OmitType(Wallet, ['owner'], ObjectType)) {
    @Field({ description: 'Price of tier' })
    @IsNumberString()
    readonly price: string;

    @Field({ description: 'Total price of tier purchased' })
    @IsNumberString()
    readonly totalPrice: string;

    @Field(() => Int)
    @IsNumber()
    readonly quantity: number;

    @Field(() => Tier, { description: 'The collection tiers', nullable: true })
    @IsObject()
    readonly tier?: Tier;

    @IsDateString()
    @Field({ description: 'The DateTime that this collection was created(initially created as a draft).' })
    readonly createdAt: Date;
}

@ObjectType('CollectionHoldersPaginated')
export class CollectionHoldersPaginated extends Paginated(CollectionHolderData) {}

@ObjectType('TierHolderData')
export class TierHolderData extends PartialType(OmitType(Wallet, ['owner'], ObjectType)) {
    @Field(() => MintSaleTransaction, { description: 'The tier transaction', nullable: true })
    @IsObject()
    readonly transaction?: MintSaleTransaction;

    @Field(() => Asset721, { description: 'The NFT asset owner', nullable: true })
    @IsObject()
    readonly asset?: Asset721;

    @Field(() => Int, { description: 'The NFT balance of the holder'})
    @IsNumber()
    readonly quantity: number;
}

@ObjectType('TierHoldersPaginated')
export class TierHoldersPaginated extends Paginated(TierHolderData) {}

@ObjectType('WalletSold')
export class WalletSold extends PickType(
    MintSaleTransaction,
    [
        'id',
        'address',
        'tokenAddress',
        'paymentToken',
        'tokenId',
        'price',
        'txTime',
        'txHash',
        'chainId',
        'createdAt',
    ] as const,
    ObjectType
) {
    @Field(() => Tier)
    @IsObject()
    readonly tier?: Tier;
}

@ObjectType('WalletSoldPaginated')
export class WalletSoldPaginated extends Paginated(WalletSold) {}
