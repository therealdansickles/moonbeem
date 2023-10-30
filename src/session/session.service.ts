import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

import { MembershipService } from '../membership/membership.service';
import { User } from '../user/user.entity';
import { IAuthenticateUserHashedPassword, IAuthenticateUserPassword, UserService } from '../user/user.service';
import { WalletService } from '../wallet/wallet.service';
import { Session } from './session.dto';

@Injectable()
export class SessionService {
    constructor(
        private readonly userService: UserService,
        private readonly walletService: WalletService,
        private readonly jwtService: JwtService,
        private readonly membershipService: MembershipService,
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
        await this.walletService.verifyWallet(address, message, signature);
        const wallet = await this.walletService.findOrCreateWallet(address);

        if (wallet) {
            const token = await this.jwtService.signAsync({ walletId: wallet.id, walletAddress: wallet.address });
            const user = await this.userService.getUserByQuery({ id: wallet.owner?.id });
            return { token, wallet, user };
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
    async createSessionFromEmail(email: string, payload: IAuthenticateUserPassword | IAuthenticateUserHashedPassword): Promise<Session | null> {
        const user = await this.userService.authenticateUser(email, payload);

        if (user) {
            return this.createUserSession(user);
        }

        return null;
    }

    async createUserSession(user: User): Promise<Session | null> {
        const memberships = await this.membershipService.getMembershipsByUserId(user.id);
        const organizationRoles = memberships.map((membership) => {
            const organizationId = membership.organization.id;
            const role = membership.role;
            return [organizationId, role].join('::');
        });
        const token = await this.jwtService.signAsync({
            userId: user.id,
            organizationRoles: organizationRoles,
        });
        return { token, user };
    }

    /**
     * Create a session from google.
     *
     * @param accessToken The google authorized token.
     * @returns The session.
     */
    async createSessionFromGoogle(accessToken: string): Promise<Session | null> {
        const user = await this.userService.authenticateUserFromGoogle(accessToken);

        if (user) {
            return this.createUserSession(user);
        }

        return null;
    }
}
