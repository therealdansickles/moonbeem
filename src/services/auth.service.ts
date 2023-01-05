import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { ethers } from 'ethers';
import { UserWalletService } from './user.wallet.service';
import { JWTService } from './jwt.service';
import { RedisAdapter } from 'src/lib/adapters/redis.adapter';

export const SESSION_PERFIX = 'login_session';

@Injectable()
export class AuthService {
    constructor(private userWalletService: UserWalletService, private readonly jwtService: JWTService, private readonly redisClient: RedisAdapter) {}

    async validateLoginWithWallet(address: string, message: string, signature: string) {
        // verify message
        const _address = ethers.utils.verifyMessage(message, signature);
        if (address != _address) throw new HttpException('signature verification failure', HttpStatus.BAD_REQUEST);

        // check address exists
        let userWallet = await this.userWalletService.findOne(address);
        if (!userWallet) {
            await this.userWalletService.createOne(address);
            userWallet = await this.userWalletService.findOne(address);
        }
        if (userWallet.address != address.toLocaleLowerCase()) throw new HttpException('address not found', HttpStatus.SERVICE_UNAVAILABLE);

        // generate token and save token
        const accessToken = this.jwtService.createToken(address, signature);
        // save redis
        const _key = this.redisClient.getKey(address.toLocaleLowerCase(), SESSION_PERFIX);
        await this.redisClient.set(_key, accessToken);

        return {
            sessionToken: accessToken,
            item: {
                address: userWallet.address,
                name: userWallet.name,
                avatar: userWallet.avatar,
                customUrl: userWallet.customUrl,
                description: userWallet.description,
                discordLink: userWallet.discordLink,
                facebookLink: userWallet.facebookLink,
                twitterLink: userWallet.twitterLink,
                followerCount: 0,
                followingCount: 0,
            },
        };
    }

    async logoutWithWallet(address: string): Promise<boolean> {
        const _key = this.redisClient.getKey(address.toLocaleLowerCase(), SESSION_PERFIX);
        const val = this.redisClient.get(_key);
        if (!val) return true;
        this.redisClient.delete(_key);
        return true;
    }
}

export interface AuthPayload {
    address: string;
    signature: string;
}
