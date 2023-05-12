import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsEthereumAddress, IsNumber, IsOptional, IsString, IsUUID } from 'class-validator';
import { ArgsType, Field, ID, InputType, Int, ObjectType } from '@nestjs/graphql';
import { EthereumAddress } from '../lib/scalars/eth.scalar';
import { User } from '../user/user.dto';
import { Wallet } from '../wallet/wallet.dto';

@ObjectType()
export class VIPriceType {
    @Field()
    @ApiProperty()
    @IsString()
    price: string;

    @Field(() => EthereumAddress)
    @ApiProperty()
    @IsEthereumAddress()
    token: string;
}

@InputType()
export class LogoutInput {
    @Field({ nullable: true })
    @ApiProperty()
    @IsString()
    @IsOptional()
    email?: string;

    @Field(() => EthereumAddress, { nullable: true }) // graphql: mean it is a field
    @ApiProperty() // swagger: api attribute
    @IsEthereumAddress() // validator: mean it is ethereum address
    @IsOptional()
    address?: string;
}

@InputType()
export class CreateUserWithEmailInput {
    @Field()
    @ApiProperty()
    @IsString()
    email: string;

    @Field()
    @ApiProperty()
    @IsString()
    password: string;

    @Field({ nullable: true })
    @ApiProperty()
    @IsString()
    @IsOptional()
    username?: string;

    @Field({ nullable: true })
    @ApiProperty()
    @IsString()
    @IsOptional()
    name?: string;

    @Field({ nullable: true })
    @ApiProperty()
    @IsString()
    @IsOptional()
    avatarUrl?: string;

    @Field({ nullable: true })
    @ApiProperty()
    @IsString()
    @IsOptional()
    inviteCode?: string;
}

@ObjectType() // graphql: Object Type
export class VUserWalletInfo {
    @Field(() => ID) // graphql: mean it is a field
    @ApiProperty() // swagger
    @IsUUID() // warameter verification
    id: string;

    @Field(() => EthereumAddress)
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

    @Field(() => Int) // graphql: Int, not folat
    @ApiProperty()
    @IsNumber()
    followerCount: number;

    @Field(() => Int)
    @ApiProperty()
    @IsNumber()
    followingCount: number;

    @Field({ nullable: true })
    @ApiProperty()
    @IsBoolean()
    @IsOptional()
    isFollow?: boolean;

    @Field(() => Int, { nullable: true })
    @ApiProperty()
    @IsNumber()
    @IsOptional()
    holding?: number;

    @Field(() => Int, { nullable: true })
    @ApiProperty()
    @IsNumber()
    @IsOptional()
    fansCount?: number;

    @Field(() => [VIPriceType], { nullable: true })
    @ApiProperty()
    @IsOptional()
    estimatedValues?: VIPriceType[];
}

@InputType() // graphql: variables/args type
export class LoginWithWalletInput {
    @Field(() => EthereumAddress) // graphql: mean it is a field
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
export class LoginWithWalletResponse {
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
    readonly item: Wallet;
}

@InputType() // graphql: variables/args type
export class LoginWithEmailInput {
    @Field()
    @ApiProperty()
    @IsString()
    readonly email: string;

    @Field()
    @ApiProperty()
    @IsString()
    readonly password: string;
}

@ObjectType()
export class LoginWithEmailResponse {
    @Field()
    @ApiProperty({
        description: 'session token',
    })
    @IsString()
    readonly sessionToken: string;

    @Field()
    @ApiProperty({
        description: 'user info',
    })
    readonly user: User;
}
