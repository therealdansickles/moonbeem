import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { Reflector } from '@nestjs/core';
import { WalletService } from '../wallet/wallet.service';
import { JwtService } from '@nestjs/jwt';
import { UserService } from '../user/user.service';
import { GqlExecutionContext } from '@nestjs/graphql';
import { getJwtPayload } from './session.utils';

@Injectable()
export class SessionInterceptor implements NestInterceptor {
    constructor(
        private reflector: Reflector,
        private readonly jwtService: JwtService,
        private readonly walletService: WalletService,
        private readonly userService: UserService
    ) {}
    async intercept(executionContext: ExecutionContext, next: CallHandler): Promise<Observable<any>> {
        const ctx = GqlExecutionContext.create(executionContext);
        const context = ctx.getContext();
        let payload;
        try {
            payload = getJwtPayload(context.req.headers.authorization, this.jwtService, process.env.SESSION_SECRET);
        } catch (_e) {
            payload = {};
            context.verified = false;
        }
        const { userId, walletId, roles } = payload || {};
        if (userId) {
            context.user = await this.userService.getUserByQuery({ id: userId });
        }
        if (walletId) {
            context.wallet = await this.walletService.getWallet(walletId);
        }
        context.roles = roles;

        return next.handle();
    }
}
