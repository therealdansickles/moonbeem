import { ApiProperty } from '@nestjs/swagger';
import { IsEthereumAddress, IsString } from 'class-validator';

export class LoginReqDto {
    @IsString()
    @ApiProperty()
    @IsEthereumAddress()
    readonly address: string;

    @IsString()
    @ApiProperty()
    readonly message: string;

    @IsString()
    @ApiProperty()
    readonly signature: string;
}

export class LoginRspDto {
    @ApiProperty({
        description: 'session token',
    })
    readonly sessionToken: string;

    @ApiProperty({
        description: 'wallet info',
    })
    readonly item: UserWalletInfo;
}

export interface UserWalletInfo {
    id: string;
    address: string;
    name: string;
    avatar: string;
    customUrl: string;
    description: string;
    discordLink: string;
    facebookLink: string;
    twitterLink: string;
    followerCount: number;
    followingCount: number;
    isFollow?: boolean;
}
