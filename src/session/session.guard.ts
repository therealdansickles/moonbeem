import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { JwtService } from '@nestjs/jwt';
import { WalletService } from '../wallet/wallet.service';
import { UserService } from '../user/user.service';
import { Reflector } from '@nestjs/core';
import { captureException } from '@sentry/node';

const extractToken = (request) => {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : null;
};

@Injectable()
export class SigninByWalletGuard implements CanActivate {
    constructor(
        private reflector: Reflector,
        private readonly jwtService: JwtService,
        private readonly walletService: WalletService
    ) {}

    /**
     * Checks if the user is authenticated via the JWT token that was given to them.
     *
     * @param context The execution context.
     * @returns {Promise<boolean>}
     */
    async canActivate(context: ExecutionContext): Promise<boolean> {
        const ctx = GqlExecutionContext.create(context);
        const request = ctx.getContext().req;
        const token = extractToken(request);
        const isPublic = this.reflector.get<boolean>('isPublic', context.getHandler());

        if (isPublic) return true;

        try {
            const [walletId, wallet] = await this.getWalletFromToken(token);
            request.wallet = wallet;
            request.walletId = walletId;
            return true;
        } catch (e) {
            switch (e) {
                case 'TokenExpiredError':
                    throw new UnauthorizedException('Token expired');
                default:
                    captureException(e, {
                        tags: {
                            authentication: 'wallet',
                            token: token,
                        },
                    });
            }
            return false;
        }
    }

    /**
     * Extract the wallet and wallet id.
     *
     * @param token The token
     * @returns {Promise<any>} The wallet and wallet id
     */
    private async getWalletFromToken(token: string): Promise<any> {
        const payload = this.jwtService.verify(token, { secret: process.env.SESSION_SECRET });
        const wallet = await this.walletService.getWallet(payload.walletId);
        return [payload['walletId'], wallet];
    }
}

@Injectable()
export class SessionGuard extends SigninByWalletGuard { }

@Injectable()
export class SigninByEmailGuard implements CanActivate {
    constructor(
        private reflector: Reflector,
        private readonly jwtService: JwtService,
        private readonly userService: UserService
    ) {}

    /**
     * Checks if the user is authenticated via the JWT token that was given to them.
     *
     * @param context The execution context.
     * @returns {Promise<boolean>}
     */
    async canActivate(context: ExecutionContext): Promise<boolean> {
        const ctx = GqlExecutionContext.create(context);
        const request = ctx.getContext().req;
        const token = extractToken(request);
        const isPublic = this.reflector.get<boolean>('isPublic', context.getHandler());

        if (isPublic) return true;

        try {
            const [userId, user] = await this.getUserFromToken(token);
            request.user = user;
            request.userId = userId;
            return true;
        } catch (e) {
            switch (e) {
                case 'TokenExpiredError':
                    throw new UnauthorizedException('Token expired');
                default:
                    captureException(e, {
                        tags: {
                            authentication: 'user',
                            token: token,
                        },
                    });
            }
            return false;
        }
    }

    /**
     * Extract the user and user id.
     *
     * @param token The token
     * @returns {Promise<any>} The user and user id
     */
    private async getUserFromToken(token: string): Promise<any> {
        const payload = this.jwtService.verify(token, { secret: process.env.SESSION_SECRET });
        const user = await this.userService.getUser({ id: payload.userId });
        return [payload['userId'], user];
    }
}