import { ArgsType, Field, Int, ObjectType } from '@nestjs/graphql';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsBoolean, IsEthereumAddress, IsInt, IsNumber, IsNumberString, IsOptional, IsString } from 'class-validator';
import { EthereumAddress } from '../lib/scalars/eth.scalar.js';

@ArgsType()
@ObjectType()
export class VAddressHoldingReqDto {
    @Field((type) => EthereumAddress)
    @ApiProperty({
        example: '0x9A70b15c2936d440c82Eb988A20F11ef2cd79395',
    })
    @IsEthereumAddress()
    readonly address: string;

    @Field((type) => Int, { nullable: true, defaultValue: 0 })
    @ApiProperty({
        nullable: true,
        default: 0,
    })
    @Type(() => Number)
    @IsNumber()
    readonly skip?: number;

    @Field((type) => Int, { nullable: true, defaultValue: 10 })
    @ApiProperty({ nullable: true, default: 10 })
    @IsNumber()
    @Type(() => Number)
    readonly take?: number;
}

@ObjectType()
export class VICollectionType {
    @Field((type) => EthereumAddress)
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
    readonly extra: String;

    @Field()
    @ApiProperty()
    @IsString()
    readonly traitType: String;

    @Field()
    @ApiProperty()
    @IsString()
    readonly value: String;
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
export class NftInfo {
    @Field((type) => VICollectionType)
    @ApiProperty()
    readonly collection: VICollectionType;

    @Field((type) => EthereumAddress)
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

    @Field((type) => Int)
    @ApiProperty()
    @IsNumber()
    readonly quantity: number;

    @Field((type) => EthereumAddress)
    @ApiProperty()
    @IsEthereumAddress()
    readonly owner: string;

    @Field((type) => Int)
    @ApiProperty()
    @IsNumber()
    readonly tierId: number;

    @Field((type) => [VITierAttr])
    @ApiProperty({
        type: [VITierAttr],
    })
    readonly attributes: VITierAttr[];

    @Field()
    @ApiProperty()
    @IsNumberString()
    readonly currentPrice: string;

    @Field((type) => VSecondaryMarketView)
    @ApiProperty({ type: VSecondaryMarketView })
    readonly secondary: VSecondaryMarketView;

    @Field((type) => [String], { nullable: true })
    @ApiProperty({ type: [String], nullable: true })
    readonly extensions?: string[];
}

@ObjectType()
export class VAddressHoldingRspDto {
    @Field((type) => [NftInfo])
    @ApiProperty({
        type: [NftInfo],
    })
    readonly data: NftInfo[];

    @Field((type) => Int)
    @ApiProperty()
    @IsNumber()
    readonly total: number;
}

// activity start
@ArgsType()
@ObjectType()
export class VActivityReqDto {
    @Field((type) => EthereumAddress)
    @ApiProperty({
        example: '0x9A70b15c2936d440c82Eb988A20F11ef2cd79395',
    })
    @IsEthereumAddress()
    readonly address: string;

    @Field((type) => Int, { nullable: true, defaultValue: 0 })
    @ApiProperty({
        nullable: true,
        default: 0,
    })
    @Type(() => Number)
    @IsNumber()
    readonly skip?: number;

    @Field((type) => Int, { nullable: true, defaultValue: 10 })
    @ApiProperty({ nullable: true, default: 10 })
    @IsNumber()
    @Type(() => Number)
    readonly take?: number;
}

export enum VActivityStatus {
    Mint = 'Minted',
    Transfer = 'Transfer',
}

@ObjectType()
export class VActivityInfo {
    @Field((type) => EthereumAddress)
    @ApiProperty()
    @IsEthereumAddress()
    readonly token: string;

    @Field()
    @ApiProperty()
    @IsString()
    readonly tokenId: string;

    @Field()
    @ApiProperty()
    readonly status: VActivityStatus;

    @Field((type) => VICollectionType)
    @ApiProperty()
    readonly collection: VICollectionType;

    @Field((type) => EthereumAddress)
    @ApiProperty()
    @IsEthereumAddress()
    readonly owner: string;

    @Field((type) => EthereumAddress)
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

    @Field((type) => VSecondaryMarketView)
    @ApiProperty({ type: VSecondaryMarketView })
    readonly secondary: VSecondaryMarketView;

    @Field((type) => [VITierAttr])
    @ApiProperty({
        type: [VITierAttr],
    })
    readonly attributes: VITierAttr[];

    @Field()
    @ApiProperty()
    @IsNumberString()
    readonly currentPrice: string;

    @Field((type) => [String], { nullable: true })
    @ApiProperty({ type: [String], nullable: true })
    readonly extensions?: string[];
}

@ObjectType()
export class VActivityRspDto {
    @Field((type) => [VActivityInfo])
    @ApiProperty({
        type: [VActivityInfo],
    })
    readonly data: VActivityInfo[];

    @Field((type) => Int)
    @ApiProperty()
    @IsNumber()
    readonly total: number;
}
// activity end

// released start
@ArgsType()
@ObjectType()
export class VAddressReleasedReqDto {
    @Field((type) => EthereumAddress)
    @ApiProperty({
        example: '0x9A70b15c2936d440c82Eb988A20F11ef2cd79395',
    })
    @IsEthereumAddress()
    readonly address: string;

    @Field((type) => Int, { nullable: true, defaultValue: 0 })
    @ApiProperty({
        nullable: true,
        default: 0,
    })
    @Type(() => Number)
    @IsNumber()
    readonly skip?: number;

    @Field((type) => Int, { nullable: true, defaultValue: 10 })
    @ApiProperty({ nullable: true, default: 10 })
    @IsNumber()
    @Type(() => Number)
    readonly take?: number;
}

@ObjectType()
export class ReleasedInfo {
    @Field((type) => VICollectionType)
    @ApiProperty()
    readonly collection: VICollectionType;

    @Field((type) => EthereumAddress)
    @ApiProperty()
    @IsEthereumAddress()
    readonly token: string;

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

    @Field((type) => Int)
    @ApiProperty()
    @IsNumber()
    readonly quantity: number;

    @Field((type) => EthereumAddress)
    @ApiProperty()
    @IsEthereumAddress()
    readonly owner: string;

    @Field((type) => Int)
    @ApiProperty()
    @IsNumber()
    readonly tierId: number;

    @Field((type) => [VITierAttr])
    @ApiProperty({
        type: [VITierAttr],
    })
    readonly attributes: VITierAttr[];

    @Field()
    @ApiProperty()
    @IsNumberString()
    readonly currentPrice: string;

    @Field((type) => VSecondaryMarketView)
    @ApiProperty({ type: VSecondaryMarketView })
    readonly secondary: VSecondaryMarketView;

    @Field((type) => [String], { nullable: true })
    @ApiProperty({ type: [String], nullable: true })
    readonly extensions?: string[];
}

@ObjectType()
export class VAddressReleasedRspDto {
    @Field((type) => [ReleasedInfo])
    @ApiProperty({
        type: [ReleasedInfo],
    })
    readonly data: ReleasedInfo[];

    @Field((type) => Int)
    @ApiProperty()
    @IsNumber()
    readonly total: number;
}
// released end

// collection activity start
@ArgsType()
@ObjectType()
export class VCollectionActivityReqDto {
    @Field((type) => EthereumAddress)
    @ApiProperty({
        example: '0x9A70b15c2936d440c82Eb988A20F11ef2cd79395',
    })
    @IsEthereumAddress()
    readonly address: string;

    @Field((type) => Int, { nullable: true, defaultValue: 0 })
    @ApiProperty({
        nullable: true,
        default: 0,
    })
    @Type(() => Number)
    @IsNumber()
    readonly skip?: number;

    @Field((type) => Int, { nullable: true, defaultValue: 10 })
    @ApiProperty({ nullable: true, default: 10 })
    @IsNumber()
    @Type(() => Number)
    readonly take?: number;
}

@ObjectType()
export class VCollectionActivityInfo {
    @Field((type) => EthereumAddress)
    @ApiProperty()
    @IsEthereumAddress()
    readonly token: string;

    @Field()
    @ApiProperty()
    @IsString()
    readonly tokenId: string;

    @Field((type) => Int)
    @ApiProperty()
    @IsNumber()
    readonly txTime: number;

    @Field()
    @ApiProperty()
    readonly status: VActivityStatus;

    @Field((type) => VICollectionType)
    @ApiProperty()
    readonly collection: VICollectionType;

    @Field((type) => EthereumAddress)
    @ApiProperty()
    @IsEthereumAddress()
    readonly owner: string;

    @Field((type) => EthereumAddress)
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

    @Field((type) => VSecondaryMarketView)
    @ApiProperty({ type: VSecondaryMarketView })
    readonly secondary: VSecondaryMarketView;

    @Field((type) => [VITierAttr])
    @ApiProperty({
        type: [VITierAttr],
    })
    readonly attributes: VITierAttr[];

    @Field()
    @ApiProperty()
    @IsNumberString()
    readonly currentPrice: string;

    @Field((type) => [String], { nullable: true })
    @ApiProperty({ type: [String], nullable: true })
    readonly extensions?: string[];
}

@ObjectType()
export class VCollectionActivityRspDto {
    @Field((type) => [VCollectionActivityInfo])
    @ApiProperty({
        type: [VCollectionActivityInfo],
    })
    readonly data: VCollectionActivityInfo[];

    @Field((type) => Int)
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
    name: String;

    @Field()
    @ApiProperty()
    @IsString()
    @IsOptional()
    image: String;

    @Field((type) => EthereumAddress)
    @ApiProperty()
    @IsEthereumAddress()
    collection: string;

    @Field()
    @ApiProperty()
    @IsNumber()
    @IsOptional()
    itemsCount: Number;
}

@ObjectType()
export class VSearchAccountItem {
    @Field()
    @ApiProperty()
    @IsString()
    name: String;

    @Field()
    @ApiProperty()
    @IsString()
    @IsOptional()
    avatar: String;

    @Field((type) => EthereumAddress)
    @ApiProperty()
    @IsEthereumAddress()
    address: string;
}

@ObjectType()
export class VSearchCollectionRsp {
    @Field((type) => [VSearchCollectionItem])
    @ApiProperty({
        type: [VSearchCollectionItem],
    })
    @IsOptional()
    data: VSearchCollectionItem[];

    @ApiProperty()
    @IsBoolean()
    isLastPage: Boolean;

    @ApiProperty()
    @IsNumber()
    @Type(() => Number)
    total: Number;
}

@ObjectType()
export class VSearchAccountRsp {
    @Field((type) => [VSearchAccountItem])
    @ApiProperty({
        type: [VSearchAccountItem],
    })
    @IsOptional()
    data: VSearchAccountItem[];

    @ApiProperty()
    @IsBoolean()
    isLastPage: Boolean;

    @ApiProperty()
    @IsNumber()
    @Type(() => Number)
    total: Number;
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
