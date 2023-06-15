import { applyDecorators, Injectable } from '@nestjs/common';
import { CanActivate, ExecutionContext, SetMetadata, UseGuards } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { GqlExecutionContext } from '@nestjs/graphql';
import { JwtService } from '@nestjs/jwt';
import { Observable } from 'rxjs';
import { get } from 'lodash';

const WALLET_PARAMETER = Symbol('WALLET_PARAMETER');

const USER_PARAMETER = Symbol('USER_PARAMETER');

interface IGraphQLRequest {
    headers: any;
    body: {
        query: string,
        variables?: any
    }
}
@Injectable()
export class AuthorizedWalletGuard implements CanActivate {
    constructor(private readonly reflector: Reflector, private readonly jwtService: JwtService) { }

    canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
        const walletParameter = this.reflector.get<string>(WALLET_PARAMETER, context.getHandler());
        if (!walletParameter) return false;

        const ctx = GqlExecutionContext.create(context);
        const request: IGraphQLRequest = ctx.getContext().req;
        const walletIdFromParameter = get(request.body.variables?.input, walletParameter);
        const walletIdFromToken = this.getWalletIdFromToken(request);

        if (!walletIdFromParameter || !walletIdFromToken) return false;
        return walletIdFromParameter === walletIdFromToken;
    }

    getWalletIdFromToken(request): string | undefined {
        const [type, token] = request.headers.authorization?.split(' ') ?? [];
        if (type !== 'Bearer') return;
        const payload = this.jwtService.verify(token, { secret: process.env.SESSION_SECRET });
        return payload.walletId;
    }
}

export function AuthorizedWallet(key: string) {
    return applyDecorators(
        SetMetadata(WALLET_PARAMETER, key),
        UseGuards(AuthorizedWalletGuard)
    );
}

@Injectable()
export class AuthorizedUserGuard implements CanActivate {
    constructor(private readonly reflector: Reflector, private readonly jwtService: JwtService) { }

    canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
        const userParameter = this.reflector.get<string>(USER_PARAMETER, context.getHandler());
        if (!userParameter) return false;

        const ctx = GqlExecutionContext.create(context);
        const request: IGraphQLRequest = ctx.getContext().req;
        const userIdFromParameter = get(request.body.variables?.input, userParameter);
        const userIdFromToken = this.getUserIdFromToken(request);

        if (!userIdFromParameter || !userIdFromToken) return false;
        return userIdFromParameter === userIdFromToken;
    }

    getUserIdFromToken(request): string | undefined {
        const [type, token] = request.headers.authorization?.split(' ') ?? [];
        if (type !== 'Bearer') return;
        const payload = this.jwtService.verify(token, { secret: process.env.SESSION_SECRET });
        return payload.userId;
    }
}

export function AuthorizedUser(key: string) {
    return applyDecorators(
        SetMetadata(USER_PARAMETER, key),
        UseGuards(AuthorizedUserGuard)
    );
}
