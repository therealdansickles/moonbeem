import { Field, ObjectType } from '@nestjs/graphql';
import { IsArray, IsNumber, IsObject, IsString } from 'class-validator';

@ObjectType()
export class PlatformTotalCounts {
    @Field()
    @IsNumber()
    readonly mintSaleCollectionsCount: number;

    @Field()
    @IsNumber()
    readonly mintedNFTsCount: number;

    @Field()
    @IsNumber()
    readonly totalCreatorsCount: number;

    @Field()
    @IsNumber()
    readonly totalUsersCount: number;
}

@ObjectType()
export class DataPoint {
    @Field()
    @IsString()
    readonly date: string;

    @Field()
    @IsNumber()
    readonly count: number;
}

@ObjectType()
export class PlatformData {
    @Field(() => [DataPoint])
    @IsArray()
    readonly mintSaleCollectionsData: DataPoint[];

    @Field(() => [DataPoint])
    @IsArray()
    readonly mintedNFTsData: DataPoint[];

    @Field(() => [DataPoint])
    @IsArray()
    readonly totalCreatorsData: DataPoint[];

    @Field(() => [DataPoint])
    @IsArray()
    readonly totalUsersData: DataPoint[];
}

@ObjectType('PlatformStats')
export class PlatformStats {
    @IsObject()
    @Field(() => PlatformTotalCounts)
    readonly totalCounts: PlatformTotalCounts;

    @IsObject()
    @Field(() => PlatformData)
    readonly platformData: PlatformData;
}
