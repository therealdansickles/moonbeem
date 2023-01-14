import { ArgsType, Field, ObjectType } from '@nestjs/graphql';
import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsEthereumAddress, IsOptional, IsString, IsUUID } from 'class-validator';
import { EthereumAddress } from 'src/lib/scalars/eth.scalar';

@ArgsType()
@ObjectType()
export class VFollowUserWalletReqDto {
    @Field((type) => EthereumAddress)
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
    @Field((type) => EthereumAddress)
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

    @Field((type) => EthereumAddress)
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
