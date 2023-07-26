import { Field, ObjectType, InputType, ID, PickType, OmitType, PartialType, Int } from '@nestjs/graphql';
import { IsString, IsOptional, IsNumber, IsArray, IsObject, IsDateString } from 'class-validator';
import { Collection } from '../collection/collection.dto';
import Paginated from '../lib/pagination/pagination.model';
import { Profit, Tier } from '../tier/tier.dto';
import { Wallet } from '../wallet/wallet.dto';

@ObjectType('User')
export class User {
    @IsString()
    @Field(() => ID)
    readonly id: string;

    @Field({ description: 'The username of the user.', nullable: true })
    @IsString()
    @IsOptional()
    readonly username?: string;

    @Field({ description: 'The name of the user.', nullable: true })
    @IsString()
    @IsOptional()
    readonly name?: string;

    @Field({ description: 'The email of the user.' })
    @IsString()
    readonly email: string;

    @Field({ description: 'The verification token for the user.', nullable: true })
    @IsString()
    @IsOptional()
    readonly verificationToken?: string;

    @IsString()
    @IsOptional()
    readonly password?: string;

    @Field({ description: 'The avatarUrl of the user.', nullable: true })
    @IsString()
    @IsOptional()
    readonly avatarUrl?: string;

    @Field({ description: "The URL pointing to the user's background.", nullable: true })
    @IsString()
    @IsOptional()
    readonly backgroundUrl?: string;

    @Field({ description: 'The description for the user.', nullable: true })
    @IsString()
    @IsOptional()
    readonly about?: string;

    @Field({ description: "The url of the user's website.", nullable: true })
    @IsString()
    @IsOptional()
    readonly websiteUrl?: string;

    @Field({ description: 'The twitter handle for the user.', nullable: true })
    @IsString()
    @IsOptional()
    readonly twitter?: string;

    @IsString()
    @IsOptional()
    @Field({ description: 'The instagram handle for the user.', nullable: true })
    readonly instagram?: string;

    @IsString()
    @IsOptional()
    @Field({ description: 'The discord handle for the user.', nullable: true })
    readonly discord?: string;

    @Field(() => [Wallet], { description: 'The wallets of the user.', nullable: true })
    readonly wallets?: Wallet[];
}

@InputType()
export class CreateUserInput extends OmitType(User, ['id', 'wallets'] as const, InputType) {
    @Field({ description: 'The password for the user.', nullable: true })
    @IsString()
    @IsOptional()
    @IsString()
        password?: string;

    @Field({ description: "User provider: 'google' or 'local')", nullable: true })
    @IsString()
    @IsOptional()
    @IsString()
        provider?: string;
}

@InputType()
export class UserInput extends PickType(User, ['id'] as const, InputType) {}

@InputType()
export class VerifyUserInput extends PickType(User, ['email', 'verificationToken'] as const, InputType) {}

@InputType()
export class UpdateUserInput extends PartialType(OmitType(User, ['password', 'wallets'] as const), InputType) {}

@ObjectType()
export class UserOutput extends OmitType(
    User,
    ['password', 'websiteUrl', 'twitter', 'instagram', 'discord', 'wallets'],
    ObjectType
) {}

@ObjectType()
export class SearchUser {
    @Field(() => Int)
    @IsNumber()
    readonly total: number;

    @Field(() => [UserOutput])
    @IsArray()
    readonly users: UserOutput[];
}

@ObjectType('UserProfit')
export class UserProfit extends Profit {}

export interface PriceInfo {
    price: string;
    token: string;
}

@ObjectType('LatestSalePrices')
export class LatestSalePrices extends Profit {}

@ObjectType('LatestSaleData')
export class LatestSaleData {
    @Field(() => Tier, { description: 'Sales of collection and id.', nullable: true })
    @IsObject()
    readonly tier?: Tier;

    @Field(() => Collection, { description: 'Sales of collection.', nullable: true })
    @IsObject()
    readonly collection?: Tier;

    @IsString()
    @Field({ description: 'Transaction hash of transaction.' })
    readonly txHash: string;

    @IsNumber()
    @Field({ description: 'Transaction time of transaction.' })
    readonly txTime: number;

    @IsString()
    @Field({ description: 'NFT Recipient of current transaction.' })
    readonly recipient: string;

    @IsString()
    @Field({ description: 'The contract address' })
    readonly address: string;

    @IsString()
    @Field({ description: 'The payment token address' })
    readonly paymentToken: string;

    @Field(() => Int, { description: 'The current quantity of the txHash' })
    @IsNumber()
    readonly quantity: number;

    @Field(() => LatestSalePrices, { description: 'The current price.' })
    @IsObject()
    readonly totalPrice: LatestSalePrices;

    @IsDateString()
    @Field({ description: 'The DateTime that this latest slae was created.' })
    readonly createdAt: Date;
}

@ObjectType('LatestSalePaginated')
export class LatestSalePaginated extends Paginated(LatestSaleData) {}
