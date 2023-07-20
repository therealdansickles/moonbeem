import { IsString, IsObject, IsArray, IsBoolean, IsNumber } from 'class-validator';
import { ObjectType, Field } from '@nestjs/graphql';

@ObjectType()
export class PaymentToken {
    @Field()
    @IsString()
        symbol: string;

    @Field({ description: "author's wallet" })
    @IsString()
        address: string;

    @Field({ description: 'address of image' })
    @IsString()
        image_url: string;

    @Field({ description: 'nft name' })
    @IsString()
        name: string;

    @Field({ description: 'decimal to find the price ETH' })
    @IsString()
        decimals: string;

    @Field({ description: 'Price ETH' })
    @IsString()
        eth_price: string;

    @Field({ description: 'Price USD' })
    @IsString()
        usd_price: string;
}

@ObjectType()
export class Account {
    @Field({ description: 'Address user' })
    @IsString()
        address: string;

    @Field({ description: 'Address image user' })
    @IsString()
        profile_img_url: string;
}

@ObjectType()
export class Transaction {
    @Field({ description: 'User contact ' })
    @IsObject()
        from_account: Account;

    @Field({ description: ' User contact ' })
    @IsObject()
        to_account: Account;

    @Field({ description: 'Date of transaction' })
    @IsString()
        timestamp: string;
}

@ObjectType()
export class AssetContract {
    @Field()
    @IsString()
        address: string;
}

@ObjectType()
export class CollectionOPenSea {
    @Field()
    @IsBoolean()
        is_rarity_enabled: boolean;
}

@ObjectType()
export class Asset {
    @Field({ description: 'Num of sales' })
    @IsString()
        num_sales: string;

    @Field({ description: 'Address od image' })
    @IsString()
        image_url: string;

    @Field()
    @IsString()
        name: string;

    @Field({ description: 'Is rarity' })
    @IsObject()
        collection: CollectionOPenSea;

    @Field({ description: 'Address contract' })
    @IsObject()
        asset_contract: AssetContract;
}

@ObjectType()
export class Sale {
    @Field()
    @IsObject()
    readonly asset: Asset;

    @Field()
    @IsObject()
        payment_token: PaymentToken;

    @Field()
    @IsString()
        event_timestamp: string;

    @Field()
    @IsString()
    readonly total_price?: string;

    @Field()
    @IsString()
        quantity: string;

    @Field()
    @IsString()
    readonly listing_time: string;

    @Field({ description: 'transaction data' })
    @IsObject()
    readonly transaction: Transaction;

    @Field({ description: 'NFT Name' })
    @IsString()
        nftName: string;

    @Field()
    @IsString()
        nftPicture: string;

    @Field()
    @IsString()
        currentPrice: string;

    @Field()
    @IsBoolean()
        rarity: boolean;

    @Field()
    @IsString()
        timeListed: string;

    @Field({ description: "sender's transfer" })
    @IsString()
        from: string;

    @Field({ description: 'receiving wallet address' })
    @IsString()
        to: string;

    @Field()
    @IsString()
        time: string;

    @Field({ description: 'date created' })
    @IsString()
        created_date: string;
}

@ObjectType()
export class SaleHistory {
    @Field(() => [Sale], { description: 'Even list' })
    @IsArray()
    public asset_events!: Sale[];

    @Field({ description: 'next page' })
    @IsString()
    public next: string;
}

@ObjectType()
export class EarningPerDay {
    @Field(() => Number, { description: 'amount per day' })
    @IsNumber()
    public total: number;

    @Field({ description: 'day' })
    @IsString()
    public day: string;
}

@ObjectType()
export class EarningChart {
    @Field(() => [EarningPerDay], { description: 'Earinig' })
    @IsArray()
    public totalAmountPerDay!: EarningPerDay[];
}
