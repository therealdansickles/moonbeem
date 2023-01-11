import { ApiProperty } from '@nestjs/swagger';
import { IsEthereumAddress, IsString } from 'class-validator';
import { ArgsType, Field, ID, Int, ObjectType } from '@nestjs/graphql';

@ObjectType() // graphql: Object Type
export class UserWalletInfo {
    @Field((type) => ID) // graphql: mean it is a field
    id: string;

    @Field()
    address: string;

    @Field()
    name: string;

    @Field({ nullable: true }) // graphql: can be null, not String!
    avatar: string;

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

    @Field((type) => Int) // graphql: Int, not folat
    followerCount: number;

    @Field((type) => Int)
    followingCount: number;

    @Field({ nullable: true })
    isFollow?: boolean;
}

@ArgsType() // graphql: variables/args type
export class LoginReqDto {
    @Field() // graphql: mean it is a field
    @IsString() // validator: type verify
    @ApiProperty() // swagger: api attribute
    @IsEthereumAddress() // validator: mean it is ethereum address
    readonly address: string;

    @Field()
    @IsString()
    @ApiProperty()
    readonly message: string;

    @Field()
    @IsString()
    @ApiProperty()
    readonly signature: string;
}

@ObjectType()
export class LoginRspDto {
    @Field()
    @ApiProperty({
        description: 'session token',
    })
    readonly sessionToken: string;

    @Field()
    @ApiProperty({
        description: 'wallet info',
    })
    readonly item: UserWalletInfo;
}
