import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { JwtService } from '@nestjs/jwt';
import { WalletService } from '../wallet/wallet.service';
import { Reflector } from '@nestjs/core';
import { captureException } from '@sentry/node';

@Injectable()
export class SessionGuard implements CanActivate {
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
        const token = this.extractToken(request);
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

        return false;
    }

    /**
     * Extract token from the headers
     *
     * @param request The request object
     * @returns {string | null} The token
     */
    private extractToken(request): string | null {
        const [type, token] = request.headers.authorization?.split(' ') ?? [];
        return type === 'Bearer' ? token : null;
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
