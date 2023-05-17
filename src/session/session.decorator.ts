import { Inject, SetMetadata, createParamDecorator, ExecutionContext } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';

export const IS_PUBLIC_KEY = 'isPublic';

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
