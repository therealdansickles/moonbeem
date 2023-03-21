import { ArgsType, Field, Int, ObjectType } from '@nestjs/graphql';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNumber, IsOptional } from 'class-validator';
import { GraphQLJSONObject } from 'graphql-type-json';
import { BasicWalletInfo, BasicCollectionInfo, BasicCollectionRoyaltyInfo, BasicFloorPriceInfo, BasicTierInfo, BasicPagingParams, BasicCollectionStatus, BasicCollectionType, BasicPriceInfo } from './basic.dto';

@ObjectType()
export class LandingPageCollectionData {
    @Field(() => BasicWalletInfo)
    @ApiProperty({ type: BasicWalletInfo })
    readonly creator: BasicWalletInfo;

    @Field(() => BasicCollectionInfo)
    @ApiProperty({ type: BasicCollectionInfo })
    readonly collection: BasicCollectionInfo;

    @Field(() => BasicCollectionRoyaltyInfo)
    @ApiProperty({ type: BasicCollectionRoyaltyInfo })
    readonly royalty: BasicCollectionRoyaltyInfo;

    @Field(() => BasicFloorPriceInfo)
    @ApiProperty({ type: BasicFloorPriceInfo })
    readonly floorPrice: BasicFloorPriceInfo;

    @Field(() => [BasicTierInfo])
    @ApiProperty({ type: [BasicTierInfo] })
    readonly tiers: BasicTierInfo[];

    @Field(() => GraphQLJSONObject)
    @ApiProperty({ type: JSON })
    readonly attributeOverview: JSON;
}

@ArgsType()
@ObjectType()
export class LandingPageCollectionReqDto extends BasicPagingParams {
    @Field(() => BasicCollectionStatus, { nullable: true })
    @ApiProperty({ nullable: true, type: BasicCollectionStatus })
    @IsOptional()
    readonly status?: BasicCollectionStatus;

    @Field(() => BasicCollectionType, { nullable: true })
    @ApiProperty({ nullable: true, type: BasicCollectionType })
    @IsOptional()
    readonly type?: BasicCollectionType;
}

@ObjectType()
export class LandingPageCollectionRspDto {
    @Field(() => [LandingPageCollectionData])
    @ApiProperty({ type: [LandingPageCollectionData] })
    @Type()
    readonly data: LandingPageCollectionData[];

    @Field(() => Int)
    @ApiProperty()
    @Type(() => Number)
    @IsNumber()
    readonly total: number;
}

@ObjectType()
export class LandingPageRankingOfCreatorData {
    @Field(() => BasicWalletInfo)
    @ApiProperty({ type: BasicWalletInfo })
    readonly user: BasicWalletInfo;

    @Field(() => BasicPriceInfo)
    @ApiProperty({ type: BasicPriceInfo })
    readonly volume: BasicPriceInfo;
}

@ArgsType()
@ObjectType()
export class LandingPageRankingOfCreatorsReqDto extends BasicPagingParams {
    @Field(() => Int, { nullable: true, defaultValue: 0 })
    @ApiProperty({ nullable: true, default: 0 })
    @Type(() => Number)
    @IsNumber()
    readonly startTime?: number;

    @Field(() => Int, { nullable: true, defaultValue: 0 })
    @ApiProperty({ nullable: true, default: 0 })
    @Type(() => Number)
    @IsNumber()
    readonly endTime?: number;
}

@ObjectType()
export class LandingPageRankingOfCreatorsRspDto {
    @Field(() => [LandingPageRankingOfCreatorData])
    @ApiProperty({ type: [LandingPageRankingOfCreatorData] })
    @Type()
    readonly data: LandingPageRankingOfCreatorData[];

    @Field(() => Int)
    @ApiProperty()
    @Type(() => Number)
    @IsNumber()
    readonly total: number;
}

@ObjectType()
export class LandingPageRankingOfItemData {
    @Field(() => BasicTierInfo)
    @ApiProperty({ type: BasicTierInfo })
    readonly tier: BasicTierInfo;

    @Field(() => BasicCollectionInfo)
    @ApiProperty({ type: BasicCollectionInfo })
    readonly collection: BasicCollectionInfo;
}

@ArgsType()
@ObjectType()
export class LandingPageRankingOfItemsReqDto extends BasicPagingParams {}

@ObjectType()
export class LandingPageRankingOfItemsRspDto {
    @Field(() => [LandingPageRankingOfItemData])
    @ApiProperty({ type: [LandingPageRankingOfItemData] })
    @Type()
    readonly data: LandingPageRankingOfItemData[];

    @Field(() => Int)
    @ApiProperty()
    @Type(() => Number)
    @IsNumber()
    readonly total: number;
}
