import { ArgsType, Field, Int, ObjectType } from '@nestjs/graphql';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNumber, IsOptional } from 'class-validator';
import { BasicCollectionInfo, BasicCollectionRoyaltyInfo, BasicFloorPriceInfo, BasicPagingParams, BasicTierInfo, BasicCollectionStatus, BasicCollectionType, BasicWalletInfo, BasicPriceInfo } from './basic.dto.js';
import { GraphQLJSONObject } from 'graphql-type-json';

@ObjectType()
export class LandingPageCollectionData {
    @Field((type) => BasicWalletInfo)
    @ApiProperty({ type: BasicWalletInfo })
    readonly creator: BasicWalletInfo;

    @Field((type) => BasicCollectionInfo)
    @ApiProperty({ type: BasicCollectionInfo })
    readonly collection: BasicCollectionInfo;

    @Field((type) => BasicCollectionRoyaltyInfo)
    @ApiProperty({ type: BasicCollectionRoyaltyInfo })
    readonly royalty: BasicCollectionRoyaltyInfo;

    @Field((type) => BasicFloorPriceInfo)
    @ApiProperty({ type: BasicFloorPriceInfo })
    readonly floorPrice: BasicFloorPriceInfo;

    @Field((type) => [BasicTierInfo])
    @ApiProperty({ type: [BasicTierInfo] })
    readonly tiers: BasicTierInfo[];

    @Field((type) => GraphQLJSONObject)
    @ApiProperty({ type: JSON })
    readonly attributeOverview: JSON;
}

@ArgsType()
@ObjectType()
export class LandingPageCollectionReqDto extends BasicPagingParams {
    @Field((type) => BasicCollectionStatus, { nullable: true })
    @ApiProperty({ nullable: true, type: BasicCollectionStatus })
    @IsOptional()
    readonly status?: BasicCollectionStatus;

    @Field((type) => BasicCollectionType, { nullable: true })
    @ApiProperty({ nullable: true, type: BasicCollectionType })
    @IsOptional()
    readonly type?: BasicCollectionType;
}

@ObjectType()
export class LandingPageCollectionRspDto {
    @Field((type) => [LandingPageCollectionData])
    @ApiProperty({ type: [LandingPageCollectionData] })
    @Type()
    readonly data: LandingPageCollectionData[];

    @Field((type) => Int)
    @ApiProperty()
    @Type(() => Number)
    @IsNumber()
    readonly total: number;
}

@ObjectType()
export class LandingPageRankingOfCreatorData {
    @Field((type) => BasicWalletInfo)
    @ApiProperty({ type: BasicWalletInfo })
    readonly user: BasicWalletInfo;

    @Field((type) => BasicPriceInfo)
    @ApiProperty({ type: BasicPriceInfo })
    readonly volume: BasicPriceInfo;
}

@ArgsType()
@ObjectType()
export class LandingPageRankingOfCreatorsReqDto extends BasicPagingParams {
    @Field((type) => Int, { nullable: true, defaultValue: 0 })
    @ApiProperty({ nullable: true, default: 0 })
    @Type(() => Number)
    @IsNumber()
    readonly startTime?: number;

    @Field((type) => Int, { nullable: true, defaultValue: 0 })
    @ApiProperty({ nullable: true, default: 0 })
    @Type(() => Number)
    @IsNumber()
    readonly endTime?: number;
}

@ObjectType()
export class LandingPageRankingOfCreatorsRspDto {
    @Field((type) => [LandingPageRankingOfCreatorData])
    @ApiProperty({ type: [LandingPageRankingOfCreatorData] })
    @Type()
    readonly data: LandingPageRankingOfCreatorData[];

    @Field((type) => Int)
    @ApiProperty()
    @Type(() => Number)
    @IsNumber()
    readonly total: number;
}

@ObjectType()
export class LandingPageRankingOfItemData {
    @Field((type) => BasicTierInfo)
    @ApiProperty({ type: BasicTierInfo })
    readonly tier: BasicTierInfo;

    @Field((type) => BasicCollectionInfo)
    @ApiProperty({ type: BasicCollectionInfo })
    readonly collection: BasicCollectionInfo;
}

@ArgsType()
@ObjectType()
export class LandingPageRankingOfItemsReqDto extends BasicPagingParams {}

@ObjectType()
export class LandingPageRankingOfItemsRspDto {
    @Field((type) => [LandingPageRankingOfItemData])
    @ApiProperty({ type: [LandingPageRankingOfItemData] })
    @Type()
    readonly data: LandingPageRankingOfItemData[];

    @Field((type) => Int)
    @ApiProperty()
    @Type(() => Number)
    @IsNumber()
    readonly total: number;
}
