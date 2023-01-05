import { IsEthereumAddress, IsString } from 'class-validator';

export class LoginReqDto {
    @IsString()
    @IsEthereumAddress()
    readonly address: string;

    @IsString()
    readonly message: string;

    @IsString()
    readonly signature: string;
}

export class LoginRsp {
    readonly sessionToken: string;
    readonly item: UserWalletInfo;
}

export interface UserWalletInfo {
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
}
