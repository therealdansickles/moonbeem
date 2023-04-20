import { ArgsType, Field, Int, ObjectType } from '@nestjs/graphql';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsBoolean, IsEthereumAddress, IsNumber, IsOptional, IsString, IsUUID } from 'class-validator';
import { EthereumAddress } from '../lib/scalars/eth.scalar';

@ArgsType()
@ObjectType()
export class VFollowUserWalletReqDto {
    @Field(() => EthereumAddress)
    @ApiProperty()
    @IsEthereumAddress()
    readonly address: string;

    @Field({ nullable: true })
    @ApiProperty()
    @IsBoolean()
    @IsOptional()
    readonly isFollowed?: boolean;
}

@ArgsType()
@ObjectType()
export class VGetAddressReqDto {
    @Field(() => EthereumAddress)
    @ApiProperty()
    @IsEthereumAddress()
    readonly address: string;
}

@ArgsType()
@ObjectType()
export class VUpdateUserWalletReqDto {
    @Field({ nullable: true })
    @ApiProperty()
    @IsString()
    @IsOptional()
    readonly name?: string;

    @Field({ nullable: true })
    @ApiProperty()
    @IsString()
    @IsOptional()
    readonly avatar?: string;

    @Field({ nullable: true })
    @ApiProperty()
    @IsString()
    @IsOptional()
    readonly customUrl?: string;

    @Field({ nullable: true })
    @ApiProperty()
    @IsString()
    @IsOptional()
    readonly description?: string;

    @Field({ nullable: true })
    @ApiProperty()
    @IsString()
    @IsOptional()
    readonly discordLink?: string;

    @Field({ nullable: true })
    @ApiProperty()
    @IsString()
    @IsOptional()
    readonly facebookLink?: string;

    @Field({ nullable: true })
    @ApiProperty()
    @IsString()
    @IsOptional()
    readonly twitterLink?: string;
}

@ObjectType()
export class VUserWallet {
    @Field()
    @ApiProperty()
    @IsUUID()
    id: string;

    @Field(() => EthereumAddress)
    @ApiProperty()
    @IsEthereumAddress()
    address: string;

    @Field()
    @ApiProperty()
    @IsString()
    name: string;

    @Field()
    @ApiProperty()
    @IsString()
    avatar: string;

    @Field()
    @ApiProperty()
    @IsString()
    createdTime: string;

    @Field()
    @ApiProperty()
    @IsString()
    updatedTime: string;

    @Field()
    @ApiProperty()
    @IsString()
    user: string;

    @Field()
    @ApiProperty()
    @IsString()
    banner: string;

    @Field()
    @ApiProperty()
    @IsString()
    customUrl: string;

    @Field()
    @ApiProperty()
    @IsString()
    description: string;

    @Field()
    @ApiProperty()
    @IsString()
    discordLink: string;

    @Field()
    @ApiProperty()
    @IsString()
    facebookLink: string;

    @Field()
    @ApiProperty()
    @IsString()
    twitterLink: string;

    @Field()
    @ApiProperty()
    @IsString()
    collection: string;

    @Field()
    @ApiProperty()
    @IsString()
    walletType: string;

    @Field()
    @ApiProperty()
    @IsBoolean()
    visible: boolean;
}

@ArgsType()
@ObjectType()
export class VUserFollowingListReqDto {
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
export class VFollowingInfo {
    @Field()
    @ApiProperty()
    @IsString()
    readonly name: string;

    @Field(() => EthereumAddress)
    @ApiProperty()
    @IsEthereumAddress()
    readonly address: string;

    @Field()
    @ApiProperty()
    @IsString()
    readonly avatar: string;

    @Field()
    @ApiProperty()
    @IsNumber()
    readonly followingCount: number;

    @Field()
    @ApiProperty()
    @IsNumber()
    readonly followerCount: number;

    @Field({ nullable: true })
    @ApiProperty()
    @IsBoolean()
    isFollowed?: boolean;
}

@ObjectType()
export class VUserFollowingListRspDto {
    @Field(() => [VFollowingInfo])
    @ApiProperty({ type: [VFollowingInfo] })
    readonly data: VFollowingInfo[];

    @Field()
    @ApiProperty()
    @IsNumber()
    readonly total: number;
}

@ArgsType()
@ObjectType()
export class VUserFollowerListReqDto {
    @Field(() => EthereumAddress)
    @ApiProperty({
        example: '0xee6bf10a93c73617432e0debec4e10920ae898a1',
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
export class VUserFollowerListRspDto {
    @Field(() => [VFollowingInfo])
    @ApiProperty({ type: [VFollowingInfo] })
    readonly data: VFollowingInfo[];

    @Field()
    @ApiProperty()
    @IsNumber()
    readonly total: number;
}
