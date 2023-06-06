import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

import { Session } from './session.dto';
import { UserService } from '../user/user.service';
import { WalletService } from '../wallet/wallet.service';

@Injectable()
export class SessionService {
    constructor(
        private readonly userService: UserService,
        private readonly walletService: WalletService,
        private readonly jwtService: JwtService
    ) {}

    /**
     * Create a session for a wallet.
     *
     * @param address The wallet address.
     * @param message The message to sign.
     * @param signature The signature of the message.
     * @returns The session.
     */
    async createSession(address: string, message: string, signature: string): Promise<Session | null> {
        const wallet = await this.walletService.verifyWallet(address, message, signature);

        if (wallet) {
            const token = await this.jwtService.signAsync({ walletId: wallet.id });
            return { token, wallet };
        }
        return null;
    }

    /**
     * Create a session from an existing email and password.
     *
     * @param email The email of the user.
     * @param password The password of the user.
     * @returns The session.
     */
    async createSessionFromEmail(email: string, password: string): Promise<Session | null> {
        const user = await this.userService.verifyUser(email, password);

        if (user) {
            const token = await this.jwtService.signAsync({ userId: user.id });
            return { token, user };
        }

        return null;
    }

    /**
     * Create a session from google.
     *
     * @param accessToken The google authorized token.
     * @returns The session.
     */
    async createSessionFromGoogle(accessToken: string): Promise<Session | null> {
        const user = await this.userService.verifyUserFromGoogle(accessToken);

        if (user) {
            const token = await this.jwtService.signAsync({ userId: user.id });
            return { token, user };
        }

        return null;
    }
}
