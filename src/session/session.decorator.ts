import { AuthorizedTokenGuard, AuthorizedUserGuard, AuthorizedWalletAddressGuard, AuthorizedWalletGuard } from './session.guard';
import {
    ExecutionContext,
    SetMetadata,
    UseGuards,
    applyDecorators,
    createParamDecorator
} from '@nestjs/common';

import { GqlExecutionContext } from '@nestjs/graphql';

export const IS_PUBLIC_KEY = 'isPublic';

export const WALLET_PARAMETER = Symbol('WALLET_PARAMETER');

export const WALLET_ADDRESS_PARAMETER = Symbol('WALLET_ADDRESS_PARAMETER');

export const USER_PARAMETER = Symbol('USER_PARAMETER');

export const TOKEN_ID_PARAMETER = Symbol('TOKEN_ID_PARAMETER');

export const COLLECTION_ID_PARAMETER = Symbol('COLLECTION_ID_PARAMETER');

/**
 * Set the metadata for a public endpoint.
 * If not set, routes are locked down.
 */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

/**
 * Get the current wallet from the request.
 * @returns The current wallet.
 */
export const CurrentWallet = createParamDecorator((data: unknown, context: ExecutionContext) => {
    const ctx = GqlExecutionContext.create(context);
    const request = ctx.getContext().req;
    return request.wallet;
});

/**
 * Get the current user from the request.
 * @returns The current user.
 */
export const CurrentUser = createParamDecorator((data: unknown, context: ExecutionContext) => {
    const ctx = GqlExecutionContext.create(context);
    const request = ctx.getContext().req;
    return request.user;
});

export function AuthorizedWallet(key: string) {
    return applyDecorators(
        SetMetadata(WALLET_PARAMETER, key),
        UseGuards(AuthorizedWalletGuard)
    );
}

export function AuthorizedWalletAddress(key: string) {
    return applyDecorators(
        SetMetadata(WALLET_ADDRESS_PARAMETER, key),
        UseGuards(AuthorizedWalletAddressGuard)
    );
}

export function AuthorizedUser(key: string) {
    return applyDecorators(
        SetMetadata(USER_PARAMETER, key),
        UseGuards(AuthorizedUserGuard)
    );
}

export function AuthorizedToken(parameter: { token: string, collection: string, owner: string }) {
    return applyDecorators(
        SetMetadata(TOKEN_ID_PARAMETER, parameter.token),
        SetMetadata(COLLECTION_ID_PARAMETER, parameter.collection),
        SetMetadata(WALLET_ADDRESS_PARAMETER, parameter.owner),
        UseGuards(AuthorizedTokenGuard)
    )
}