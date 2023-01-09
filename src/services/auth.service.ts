import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { ethers } from 'ethers';
import { UserWalletService } from './user.wallet.service';
import { JWTService } from './jwt.service';
import { RedisAdapter } from 'src/lib/adapters/redis.adapter';
import { LoginRspDto } from 'src/dto/auth.dto';
import { jwtConfig } from 'src/lib/configs/jwt.config';

export const SESSION_PERFIX = 'login_session';

@Injectable()
export class AuthService {
    constructor(private userWalletService: UserWalletService, private readonly jwtService: JWTService, private readonly redisClient: RedisAdapter) {}

    /**
     * login with wallet, needs to signature
     * @param address user address, lowercase is recommended
     * @param message signed message content
     * @param signature information returned by the signature
     * @returns session and basic wallet information
     */
    async loginWithWallet(address: string, message: string, signature: string): Promise<LoginRspDto> {
        // verify message
        const _address = ethers.utils.verifyMessage(message, signature);
        if (address != _address.toLocaleLowerCase()) throw new HttpException('signature verification failure', HttpStatus.BAD_REQUEST);

        // check address exists
        let userWallet = await this.userWalletService.getUserWalletInfo(address);
        if (!userWallet) {
            await this.userWalletService.createOne(address);
            userWallet = await this.userWalletService.getUserWalletInfo(address);
        }
        if (userWallet.address != address) throw new HttpException('address not found', HttpStatus.SERVICE_UNAVAILABLE);

        // generate token and save token
        const accessToken = this.jwtService.createToken(userWallet.id, address, signature);
        // save redis
        const _key = this.redisClient.getKey(address, SESSION_PERFIX);
        await this.redisClient.set(_key, accessToken);

        return {
            sessionToken: accessToken,
            item: userWallet,
        };
    }

    /**
     * logout, needs to session
     * @param address which wallet you want to logout
     * @returns boolean
     */
    async logoutWithWallet(address: string): Promise<boolean> {
        const _key = this.redisClient.getKey(address.toLocaleLowerCase(), SESSION_PERFIX);
        const val = this.redisClient.get(_key);
        if (!val) return true;
        this.redisClient.delete(_key);
        return true;
    }
}

export interface AuthPayload {
    id: string;
    address: string;
    signature: string;
}
