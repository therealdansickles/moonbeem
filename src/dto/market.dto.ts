import { ArgsType, Field, Int, ObjectType } from '@nestjs/graphql';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsBoolean, IsEthereumAddress, IsInt, IsNumber, IsNumberString, IsOptional, IsString } from 'class-validator';
import { EthereumAddress } from '../lib/scalars/eth.scalar';
import { BasicCollectionInfo, BasicErc721Info, BasicPagingParams, BasicPriceInfo, BasicTierInfo } from './basic.dto';

@ArgsType()
@ObjectType()
export class VAddressHoldingReqDto {
    @Field(() => EthereumAddress)
    @ApiProperty({
        example: '0x9A70b15c2936d440c82Eb988A20F11ef2cd79395',
    })
    @IsEthereumAddress()
    readonly address: string;

    @Field(() => Int, { nullable: true, defaultValue: 0 })
    @ApiProperty({
        nullable: true,
        default: 0,
    })
    @Type(() => Number)
    @IsNumber()
    readonly skip?: number;

    @Field(() => Int, { nullable: true, defaultValue: 10 })
    @ApiProperty({ nullable: true, default: 10 })
    @IsNumber()
    @Type(() => Number)
    readonly take?: number;
}

@ObjectType()
export class VICollectionType {
    @Field(() => EthereumAddress)
    @ApiProperty()
    @IsEthereumAddress()
    readonly address: string;

    @Field()
    @ApiProperty()
    @IsString()
    readonly name: string;

    @Field()
    @ApiProperty()
    @IsString()
    readonly avatar: string;

    @Field()
    @ApiProperty()
    @IsString()
    readonly description: string;

    @Field()
    @ApiProperty()
    @IsString()
    readonly background: string;

    @Field()
    @ApiProperty()
    @IsString()
    readonly type: string;
}

@ObjectType()
export class VITierAttr {
    @Field()
    @ApiProperty()
    @IsString()
    readonly extra: string;

    @Field()
    @ApiProperty()
    @IsString()
    readonly traitType: string;

    @Field()
    @ApiProperty()
    @IsString()
    readonly value: string;
}

@ObjectType()
export class VSecondaryMarketView {
    @Field()
    @ApiProperty()
    @IsBoolean()
    readonly onSale: boolean;

    @Field()
    @ApiProperty()
    @IsNumberString()
    readonly onSalePrice: string;

    @Field()
    @ApiProperty()
    @IsNumberString()
    readonly maxSalePrice: string;

    @Field()
    @ApiProperty()
    @IsNumberString()
    readonly latestSalePrice: string;
}

@ObjectType()
export class VCoin {
    @Field()
    @ApiProperty()
    @IsString()
    readonly id: string;

    @Field()
    @ApiProperty()
    @IsNumber()
    readonly chainId: number;

    @Field()
    @ApiProperty()
    @IsString()
    readonly contract: string;

    @Field()
    @ApiProperty()
    @IsString()
    readonly name: string;

    @Field()
    @ApiProperty()
    @IsString()
    readonly symbol: string;

    @Field()
    @ApiProperty()
    @IsNumber()
    readonly decimals: number;

    @Field()
    @ApiProperty()
    @IsString()
    readonly derivedETH: string;

    @Field()
    @ApiProperty()
    @IsString()
    readonly derivedUSDC: string;

    @Field()
    @ApiProperty()
    @IsBoolean()
    readonly native: boolean;
}

@ObjectType()
export class NftInfo {
    @Field(() => VICollectionType)
    @ApiProperty()
    readonly collection: VICollectionType;

    @Field(() => EthereumAddress)
    @ApiProperty()
    @IsEthereumAddress()
    readonly token: string;

    @Field()
    @ApiProperty()
    @IsString()
    readonly tokenId: string;

    @Field()
    @ApiProperty()
    @IsString()
    readonly name: string;

    @Field()
    @ApiProperty()
    @IsString()
    readonly avatar: string;

    @Field()
    @ApiProperty()
    @IsString()
    readonly description: string;

    @Field(() => Int)
    @ApiProperty()
    @IsNumber()
    readonly quantity: number;

    @Field(() => EthereumAddress)
    @ApiProperty()
    @IsEthereumAddress()
    readonly owner: string;

    @Field(() => Int)
    @ApiProperty()
    @IsNumber()
    readonly tierId: number;

    @Field(() => [VITierAttr])
    @ApiProperty({
        type: [VITierAttr],
    })
    readonly attributes: VITierAttr[];

    @Field()
    @ApiProperty()
    @IsNumberString()
    readonly currentPrice: string;

    @Field(() => VSecondaryMarketView)
    @ApiProperty({ type: VSecondaryMarketView })
    readonly secondary: VSecondaryMarketView;

    @Field(() => [String], { nullable: true })
    @ApiProperty({ type: [String], nullable: true })
    readonly extensions?: string[];

    @Field(() => VCoin)
    @ApiProperty({ type: VCoin })
    readonly priceInfo?: VCoin;
}

@ObjectType()
export class VAddressHoldingRspDto {
    @Field(() => [NftInfo])
    @ApiProperty({
        type: [NftInfo],
    })
    readonly data: NftInfo[];

    @Field(() => Int)
    @ApiProperty()
    @IsNumber()
    readonly total: number;
}

// MarketAddressActivities
@ArgsType()
@ObjectType()
export class MarketAddressActivitiesReqDto extends BasicPagingParams {
    @Field(() => EthereumAddress)
    @ApiProperty({
        example: '0x9A70b15c2936d440c82Eb988A20F11ef2cd79395',
    })
    @IsEthereumAddress()
    readonly address: string;

    @Field(() => Int, { nullable: true, defaultValue: 0 })
    @ApiProperty({ nullable: true, default: 0 })
    @Type(() => Number)
    @IsNumber()
    readonly chainId?: number = 0;
}

export enum MarketAddressActivityStatus {
    Mint = 'Minted',
    Transfer = 'Transfer',
}

@ObjectType()
export class MarketAddressActivityData {
    @Field(() => BasicCollectionInfo)
    @ApiProperty({ type: BasicCollectionInfo })
    readonly collection: BasicCollectionInfo;

    @Field(() => BasicErc721Info)
    @ApiProperty({ type: BasicErc721Info })
    readonly nft: BasicErc721Info;

    @Field(() => BasicTierInfo)
    @ApiProperty({ type: BasicTierInfo })
    readonly tier: BasicTierInfo;

    @Field(() => VSecondaryMarketView)
    @ApiProperty({ type: VSecondaryMarketView })
    readonly secondary: VSecondaryMarketView;

    @Field(() => BasicPriceInfo)
    @ApiProperty({ type: BasicPriceInfo })
    readonly currentPrice: BasicPriceInfo;

    @Field(() => EthereumAddress)
    @ApiProperty()
    @IsEthereumAddress()
    readonly recipient: string;

    @Field()
    @ApiProperty()
    readonly status: MarketAddressActivityStatus;

    @Field(() => [String], { nullable: true })
    @ApiProperty({ type: [String], nullable: true })
    readonly extensions?: string[];
}

@ObjectType()
export class MarketAddressActivitiesRspDto {
    @Field(() => [MarketAddressActivityData])
    @ApiProperty({
        type: [MarketAddressActivityData],
    })
    readonly data: MarketAddressActivityData[];

    @Field(() => Int)
    @ApiProperty()
    @Type(() => Number)
    @IsNumber()
    readonly total: number;
}

// released start
@ArgsType()
@ObjectType()
export class MarketAddressReleasedReqDto extends BasicPagingParams {
    @Field(() => EthereumAddress)
    @ApiProperty({
        example: '0x9A70b15c2936d440c82Eb988A20F11ef2cd79395',
    })
    @IsEthereumAddress()
    readonly address: string;

    @Field(() => Int, { nullable: true, defaultValue: 0 })
    @ApiProperty({ nullable: true, default: 0 })
    @Type(() => Number)
    @IsNumber()
    readonly chainId?: number = 0;
}

@ObjectType()
export class MarketAddressReleasedData {
    @Field(() => BasicCollectionInfo)
    @ApiProperty({ type: BasicCollectionInfo })
    readonly collection: BasicCollectionInfo;

    @Field(() => BasicTierInfo)
    @ApiProperty({ type: BasicTierInfo })
    readonly tier: BasicTierInfo;

    @Field(() => Int)
    @ApiProperty()
    @IsNumber()
    readonly quantity: number;

    @Field(() => BasicPriceInfo)
    @ApiProperty({ type: BasicPriceInfo })
    readonly currentPrice: BasicPriceInfo;

    @Field(() => VSecondaryMarketView)
    @ApiProperty({ type: VSecondaryMarketView })
    readonly secondary: VSecondaryMarketView;

    @Field(() => [String], { nullable: true })
    @ApiProperty({ type: [String], nullable: true })
    readonly extensions?: string[];
}

@ObjectType()
export class MarketAddressReleasedRspDto {
    @Field(() => [MarketAddressReleasedData])
    @ApiProperty({
        type: [MarketAddressReleasedData],
    })
    readonly data: MarketAddressReleasedData[];

    @Field(() => Int)
    @ApiProperty()
    @Type(() => Number)
    @IsNumber()
    readonly total: number;
}
// released end

// collection activity start
@ArgsType()
@ObjectType()
export class VCollectionActivityReqDto {
    @Field(() => EthereumAddress)
    @ApiProperty({
        example: '0x9A70b15c2936d440c82Eb988A20F11ef2cd79395',
    })
    @IsEthereumAddress()
    readonly address: string;

    @Field(() => Int, { nullable: true, defaultValue: 0 })
    @ApiProperty({
        nullable: true,
        default: 0,
    })
    @Type(() => Number)
    @IsNumber()
    readonly skip?: number;

    @Field(() => Int, { nullable: true, defaultValue: 10 })
    @ApiProperty({ nullable: true, default: 10 })
    @IsNumber()
    @Type(() => Number)
    readonly take?: number;
}

@ObjectType()
export class VCollectionActivityInfo {
    @Field(() => EthereumAddress)
    @ApiProperty()
    @IsEthereumAddress()
    readonly token: string;

    @Field()
    @ApiProperty()
    @IsString()
    readonly tokenId: string;

    @Field(() => Int)
    @ApiProperty()
    @IsNumber()
    readonly txTime: number;

    @Field()
    @ApiProperty()
    readonly status: MarketAddressActivityStatus;

    @Field(() => VICollectionType)
    @ApiProperty()
    readonly collection: VICollectionType;

    @Field(() => EthereumAddress)
    @ApiProperty()
    @IsEthereumAddress()
    readonly owner: string;

    @Field(() => EthereumAddress)
    @ApiProperty()
    @IsEthereumAddress()
    readonly recipient: string;

    @Field()
    @ApiProperty()
    @IsString()
    readonly name: string;

    @Field()
    @ApiProperty()
    @IsString()
    readonly avatar: string;

    @Field()
    @ApiProperty()
    @IsString()
    readonly description: string;

    @Field(() => VSecondaryMarketView)
    @ApiProperty({ type: VSecondaryMarketView })
    readonly secondary: VSecondaryMarketView;

    @Field(() => [VITierAttr])
    @ApiProperty({
        type: [VITierAttr],
    })
    readonly attributes: VITierAttr[];

    @Field()
    @ApiProperty()
    @IsNumberString()
    readonly currentPrice: string;

    @Field(() => [String], { nullable: true })
    @ApiProperty({ type: [String], nullable: true })
    readonly extensions?: string[];
}

@ObjectType()
export class VCollectionActivityRspDto {
    @Field(() => [VCollectionActivityInfo])
    @ApiProperty({
        type: [VCollectionActivityInfo],
    })
    readonly data: VCollectionActivityInfo[];

    @Field(() => Int)
    @ApiProperty()
    @IsNumber()
    readonly total: number;
}

@ArgsType()
@ObjectType()
export class VGlobalSearchReqDto {
    @Field()
    @ApiProperty()
    @IsString()
    searchTerm: string;

    @Field()
    @ApiProperty()
    @IsInt()
    @Type(() => Number)
    @IsOptional()
    page?: number;

    @Field()
    @ApiProperty()
    @IsInt()
    @Type(() => Number)
    @IsOptional()
    pageSize?: number;
}

@ObjectType()
export class VSearchCollectionItem {
    @Field()
    @ApiProperty()
    @IsString()
    name: string;

    @Field()
    @ApiProperty()
    @IsString()
    @IsOptional()
    image: string;

    @Field(() => EthereumAddress)
    @ApiProperty()
    @IsEthereumAddress()
    collection: string;

    @Field()
    @ApiProperty()
    @IsNumber()
    @IsOptional()
    itemsCount: number;
}

@ObjectType()
export class VSearchAccountItem {
    @Field()
    @ApiProperty()
    @IsString()
    name: string;

    @Field()
    @ApiProperty()
    @IsString()
    @IsOptional()
    avatar: string;

    @Field(() => EthereumAddress)
    @ApiProperty()
    @IsEthereumAddress()
    address: string;
}

@ObjectType()
export class VSearchCollectionRsp {
    @Field(() => [VSearchCollectionItem])
    @ApiProperty({
        type: [VSearchCollectionItem],
    })
    @IsOptional()
    data: VSearchCollectionItem[];

    @ApiProperty()
    @IsBoolean()
    isLastPage: boolean;

    @ApiProperty()
    @IsNumber()
    @Type(() => Number)
    total: number;
}

@ObjectType()
export class VSearchAccountRsp {
    @Field(() => [VSearchAccountItem])
    @ApiProperty({
        type: [VSearchAccountItem],
    })
    @IsOptional()
    data: VSearchAccountItem[];

    @ApiProperty()
    @IsBoolean()
    isLastPage: boolean;

    @ApiProperty()
    @IsNumber()
    @Type(() => Number)
    total: number;
}

@ObjectType()
export class VGlobalSearchRspDto {
    @ApiProperty({
        type: [VSearchCollectionRsp],
    })
    collections: VSearchCollectionRsp;
    @ApiProperty({
        type: [VSearchAccountRsp],
    })
    accounts: VSearchAccountRsp;
}
