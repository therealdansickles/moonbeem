import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { ArgsType, Field, ID, Int, ObjectType, registerEnumType } from '@nestjs/graphql';
import { IsEthereumAddress, IsNumber, IsNumberString, IsString, IsUUID } from 'class-validator';
import { EthereumAddress } from '../lib/scalars/eth.scalar';

@ObjectType()
export class BasicPriceInfo {
    @Field()
    @ApiProperty()
    @IsNumberString()
    readonly price: string;

    @Field(() => EthereumAddress)
    @ApiProperty()
    @IsEthereumAddress()
    readonly token: string;

    @Field(() => Int)
    @ApiProperty()
    @IsNumber()
    readonly chainId: number;
}

@ObjectType()
export class BaseVolumeInfo extends BasicPriceInfo {}

@ObjectType()
export class BasicFloorPriceInfo extends BasicPriceInfo {}

@ObjectType()
export class BasicAttributeInfo {
    @Field()
    @ApiProperty()
    readonly value: string;

    @Field()
    @ApiProperty()
    readonly traitType: string;

    @Field(() => String, { nullable: true })
    @ApiProperty({ nullable: true })
    readonly displayType?: string;
}

@ArgsType()
@ObjectType()
export class BasicPagingParams {
    @Field(() => Int, { nullable: true, defaultValue: 0 })
    @ApiProperty({ nullable: true, default: 0 })
    @Type(() => Number)
    @IsNumber()
    readonly skip?: number = 0;

    @Field(() => Int, { nullable: true, defaultValue: 10 })
    @ApiProperty({ nullable: true, default: 10 })
    @Type(() => Number)
    @IsNumber()
    readonly take?: number = 10;
}

@ObjectType()
export class BasicCollectionInfo {
    @Field()
    @ApiProperty()
    @IsString()
    readonly name: string;

    @Field()
    @ApiProperty()
    @IsString()
    readonly description: string;

    @Field()
    @ApiProperty()
    @IsString()
    readonly avatar: string;

    @Field()
    @ApiProperty()
    @IsString()
    readonly background: string;

    @Field(() => EthereumAddress)
    @ApiProperty()
    @IsEthereumAddress()
    readonly address: string;

    @Field()
    @ApiProperty()
    @IsString()
    readonly type: string;

    @Field(() => Int)
    @ApiProperty()
    @IsNumber()
    readonly chainId: number;

    @Field(() => ID)
    @ApiProperty()
    @IsUUID()
    readonly orgId: string;

    @Field(() => EthereumAddress)
    @ApiProperty()
    @IsEthereumAddress()
    readonly creator: string;

    @Field(() => EthereumAddress)
    @ApiProperty()
    @IsEthereumAddress()
    readonly paymentToken: string;

    @Field(() => Int)
    @ApiProperty()
    @IsNumber()
    readonly totalSupply: number;

    @Field(() => Int)
    @ApiProperty()
    @IsNumber()
    readonly beginTime: number;

    @Field(() => Int)
    @ApiProperty()
    @IsNumber()
    readonly endTime: number;
}

@ObjectType()
export class BasicTierInfo {
    @Field(() => EthereumAddress)
    @ApiProperty()
    @IsEthereumAddress()
    readonly collection: string;

    @Field()
    @ApiProperty()
    @IsString()
    readonly name: string;

    @Field()
    @ApiProperty()
    @IsString()
    readonly description: string;

    @Field()
    @ApiProperty()
    @IsString()
    readonly avatar: string;

    @Field(() => Int)
    @ApiProperty()
    @IsNumber()
    readonly id: number;

    @Field(() => Int)
    @ApiProperty()
    @IsNumber()
    readonly startId: number;

    @Field(() => Int)
    @ApiProperty()
    @IsNumber()
    readonly endId: number;

    @Field(() => Int)
    @ApiProperty()
    @IsNumber()
    readonly currentId: number;

    @Field(() => BasicPriceInfo)
    @ApiProperty()
    @IsNumberString()
    readonly price: BasicPriceInfo;

    @Field(() => [BasicAttributeInfo])
    @ApiProperty({ type: BasicAttributeInfo })
    readonly attributes: BasicAttributeInfo[];
}

@ObjectType()
export class BasicCollectionRoyaltyInfo {
    @Field(() => EthereumAddress)
    @ApiProperty()
    @IsEthereumAddress()
    readonly address: string;

    @Field(() => Int)
    @ApiProperty()
    @IsNumber()
    readonly rate: number;
}

@ObjectType()
export class BasicWalletInfo {
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
    readonly description: string;

    @Field()
    @ApiProperty()
    @IsString()
    readonly avatar: string;

    @Field()
    @ApiProperty()
    @IsString()
    readonly discord: string;

    @Field()
    @ApiProperty()
    @IsString()
    readonly facebook: string;

    @Field()
    @ApiProperty()
    @IsString()
    readonly twitter: string;

    @Field()
    @ApiProperty()
    @IsString()
    readonly customUrl: string;
}

export enum BasicCollectionStatus {
    Upcoming = 'Upcoming',
    Live = 'Live',
    Expired = 'Expired',
}
registerEnumType(BasicCollectionStatus, { name: 'BasicCollectionStatus' });

export enum BasicCollectionType {
    Tiered = 'Tiered',
    Edition = 'Edition',
    Custom = 'Custom',
}
registerEnumType(BasicCollectionType, { name: 'BasicCollectionType' });
