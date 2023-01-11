import { ArgsType, Field, ObjectType } from '@nestjs/graphql';
import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsEthereumAddress, IsOptional, IsString } from 'class-validator';

@ArgsType()
export class FollowUserWalletReqDto {
    @Field()
    @IsEthereumAddress()
    @ApiProperty({
        example: '0xee6bf10a93c73617432e0debec4e10920ae898a1',
    })
    readonly address: string;

    @Field({ nullable: true })
    @IsBoolean()
    @ApiProperty({
        example: true,
    })
    readonly isFollowed?: boolean;
}

@ArgsType()
export class GetAddressReqDto {
    @Field()
    @IsEthereumAddress()
    @ApiProperty({
        example: '0x9A70b15c2936d440c82Eb988A20F11ef2cd79395',
    })
    readonly address: string;
}

@ArgsType()
export class UpdateUserWalletReqDto {
    @Field({ nullable: true })
    @ApiProperty({})
    @IsString()
    @IsOptional()
    readonly name?: string;

    @Field({ nullable: true })
    @ApiProperty({})
    @IsString()
    @IsOptional()
    readonly avatar?: string;

    @Field({ nullable: true })
    @ApiProperty({})
    @IsString()
    @IsOptional()
    readonly customUrl?: string;

    @Field({ nullable: true })
    @ApiProperty({})
    @IsString()
    @IsOptional()
    readonly description?: string;

    @Field({ nullable: true })
    @ApiProperty({})
    @IsString()
    @IsOptional()
    readonly discordLink?: string;

    @Field({ nullable: true })
    @ApiProperty({})
    @IsString()
    @IsOptional()
    readonly facebookLink?: string;

    @Field({ nullable: true })
    @ApiProperty({})
    @IsString()
    @IsOptional()
    readonly twitterLink?: string;
}

@ObjectType()
export class UserWallet {
    @Field()
    id: string;

    @Field()
    address: string;

    @Field()
    name: string;

    @Field()
    avatar: string;

    @Field()
    createdTime: string;

    @Field()
    updatedTime: string;

    @Field()
    user: string;

    @Field()
    banner: string;

    @Field()
    customUrl: string;

    @Field()
    description: string;

    @Field()
    discordLink: string;

    @Field()
    facebookLink: string;

    @Field()
    twitterLink: string;

    @Field()
    collection: string;

    @Field()
    walletType: string;

    @Field()
    visible: boolean;
}
