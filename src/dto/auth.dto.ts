import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsEthereumAddress, IsIn, IsInt, IsNumber, IsOptional, IsString, IsUUID } from 'class-validator';
import { ArgsType, Field, ID, Int, ObjectType } from '@nestjs/graphql';
import { EthereumAddress } from 'src/lib/scalars/eth.scalar';

@ObjectType()
export class VIPriceType {
    @Field()
    @ApiProperty()
    @IsString()
    price: string;

    @Field((type) => EthereumAddress)
    @ApiProperty()
    @IsEthereumAddress()
    token: string;
}

@ObjectType() // graphql: Object Type
export class VUserWalletInfo {
    @Field((type) => ID) // graphql: mean it is a field
    @ApiProperty() // swagger
    @IsUUID() // warameter verification
    id: string;

    @Field((type) => EthereumAddress)
    @ApiProperty()
    @IsEthereumAddress()
    address: string;

    @Field()
    @ApiProperty()
    @IsString()
    name: string;

    @Field({ nullable: true }) // graphql: can be null, not String!
    @ApiProperty()
    @IsString()
    avatar: string;

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

    @Field((type) => Int) // graphql: Int, not folat
    @ApiProperty()
    @IsNumber()
    followerCount: number;

    @Field((type) => Int)
    @ApiProperty()
    @IsNumber()
    followingCount: number;

    @Field({ nullable: true })
    @ApiProperty()
    @IsBoolean()
    @IsOptional()
    isFollow?: boolean;

    @Field((type) => Int, { nullable: true })
    @ApiProperty()
    @IsNumber()
    @IsOptional()
    holding?: number;

    @Field((type) => Int, { nullable: true })
    @ApiProperty()
    @IsNumber()
    @IsOptional()
    fansCount?: number;

    @Field((type) => [VIPriceType], { nullable: true })
    @ApiProperty()
    @IsOptional()
    estimatedValues?: VIPriceType[];
}

@ArgsType() // graphql: variables/args type
export class VLoginReqDto {
    @Field((type) => EthereumAddress) // graphql: mean it is a field
    @ApiProperty() // swagger: api attribute
    @IsEthereumAddress() // validator: mean it is ethereum address
    readonly address: string;

    @Field()
    @ApiProperty()
    @IsString()
    readonly message: string;

    @Field()
    @ApiProperty()
    @IsString()
    readonly signature: string;
}

@ObjectType()
export class VLoginRspDto {
    @Field()
    @ApiProperty({
        description: 'session token',
    })
    @IsString()
    readonly sessionToken: string;

    @Field()
    @ApiProperty({
        description: 'wallet info',
    })
    readonly item: VUserWalletInfo;
}
