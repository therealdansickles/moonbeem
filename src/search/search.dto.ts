import { ArgsType, Field, ObjectType } from '@nestjs/graphql';
import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsEthereumAddress, IsInt, IsNumber, IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';
import { EthereumAddress } from '../lib/scalars/eth.scalar';

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
    address: string;

    @Field()
    @ApiProperty()
    @IsNumber()
    chainId: number;

    @Field()
    @ApiProperty()
    @IsNumber()
    @IsOptional()
    itemsCount: number;
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
    @Field(() => VSearchCollectionRsp)
    @ApiProperty({
        type: [VSearchCollectionRsp],
    })
    collections: VSearchCollectionRsp;

    @Field(() => VSearchAccountRsp)
    @ApiProperty({
        type: [VSearchAccountRsp],
    })
    accounts: VSearchAccountRsp;
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
