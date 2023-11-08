import { createHash } from 'crypto';

import { Args, Mutation, Resolver } from '@nestjs/graphql';

import { UserService } from '../user/user.service';
import { WalletService } from '../wallet/wallet.service';
import { Public } from './session.decorator';
import { CreateSessionFromEmailInput, CreateSessionFromGoogleInput, CreateSessionInput, Session } from './session.dto';
import { SessionService } from './session.service';
import { generateRandomString } from './session.utils';

@Resolver(() => Session)
export class SessionResolver {
    constructor(
        private readonly walletService: WalletService,
        private readonly userService: UserService,
        private readonly sessionService: SessionService,
    ) {
    }

    @Public()
    @Mutation(() => Session, { description: 'Create a session.', nullable: true })
    async createSession(@Args('input') input: CreateSessionInput): Promise<Session | null> {
        const { address, message, signature, createUser = false } = input;
        await this.walletService.verifyWallet(address, message, signature);
        const wallet = await this.walletService.findOrCreateWallet(address);

        if (createUser) {
            // signin branch or signup branch
            let email;
            const passwordPayload: any = {};
            if (wallet.owner?.id) {
                email = wallet.owner.email;
                passwordPayload.hashedPassword = wallet.owner.password;
            } else {
                const hashedWalletAddress = createHash('SHA3-256').update(wallet.address).digest('hex');
                const generatedPassword = createHash('SHA3-256').update(wallet.address).update(
                    generateRandomString(10)).digest('hex');
                const user = await this.userService.createUserWithOrganization({
                    username: hashedWalletAddress,
                    email: `${hashedWalletAddress}@no-reply.vibe.xyz`,
                    password: generatedPassword,
                });
                await this.walletService.updateWallet(wallet.id, { ownerId: user.id });
                email = user.email;
                passwordPayload.password = generatedPassword;
            }

            const session = await this.sessionService.createSessionFromEmail(email, passwordPayload, address);
            return { wallet, ...session };
        }
        return this.sessionService.createSession(address, message, signature);
    }

    @Public()
    @Mutation(() => Session, { description: 'Create a session from email.', nullable: true })
    async createSessionFromEmail(@Args('input') input: CreateSessionFromEmailInput): Promise<Session | null> {
        const { email, password } = input;
        return this.sessionService.createSessionFromEmail(email, { password });
    }

    @Public()
    @Mutation(() => Session, { description: 'Create a session from google', nullable: true })
    async createSessionFromGoogle(@Args('input') input: CreateSessionFromGoogleInput): Promise<Session | null> {
        return this.sessionService.createSessionFromGoogle(input.accessToken);
    }
}
