import { ethers } from 'ethers';
import { get } from 'lodash';
import { Observable } from 'rxjs';

import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { GqlExecutionContext } from '@nestjs/graphql';
import { JwtService } from '@nestjs/jwt';
import { captureException } from '@sentry/node';

import { CollectionService } from '../collection/collection.service';
import { MembershipService } from '../membership/membership.service';
import { Asset721Service } from '../sync-chain/asset721/asset721.service';
import { MintSaleContractService } from '../sync-chain/mint-sale-contract/mint-sale-contract.service';
import { UserService } from '../user/user.service';
import { WalletService } from '../wallet/wallet.service';
import {
    COLLECTION_ID_PARAMETER,
    ORGANIZATION_ID_PARAMETER,
    TOKEN_ID_PARAMETER,
    USER_PARAMETER,
    WALLET_ADDRESS_PARAMETER,
    WALLET_PARAMETER,
} from './session.decorator';
import { IGraphQLRequest } from './session.types';
import { getUserIdFromToken } from './session.utils';

const VIBE_EMAIL_SUFFIX = '@vibe.xyz';

const extractToken = (request) => {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : null;
};

@Injectable()
export class SigninByWalletGuard implements CanActivate {
    constructor(private reflector: Reflector, private readonly jwtService: JwtService, private readonly walletService: WalletService) {}

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

// TODO: Update this SessionGuard:
//      1. Check both wallet session and email session
//      2. Write the user to ctx.getContext() as session.interceptor does, as this Guard is executed before the interceptor
//          See: https://docs.nestjs.com/faq/request-lifecycle
//      3. Cleanup the code to remove the duplicated code used in other Guards
@Injectable()
export class SessionGuard extends SigninByWalletGuard {}

@Injectable()
export class SigninByEmailGuard implements CanActivate {
    constructor(private reflector: Reflector, private readonly jwtService: JwtService, private readonly userService: UserService) {}

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
        const user = await this.userService.getUserByQuery({ id: payload.userId });
        return [payload['userId'], user];
    }
}

@Injectable()
export class AuthorizedWalletGuard implements CanActivate {
    constructor(private readonly reflector: Reflector, private readonly jwtService: JwtService) {}

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

@Injectable()
export class AuthorizedWalletAddressGuard implements CanActivate {
    constructor(private readonly reflector: Reflector, private readonly jwtService: JwtService) {}

    canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
        const walletParameter = this.reflector.get<string>(WALLET_ADDRESS_PARAMETER, context.getHandler());
        if (!walletParameter) return false;

        const ctx = GqlExecutionContext.create(context);
        const request: IGraphQLRequest = ctx.getContext().req;
        const walletAddressFromParameter = get(request.body.variables?.input, walletParameter);
        const walletAddressFromToken = this.getWalletAddressFromToken(request);

        if (!walletAddressFromParameter || !walletAddressFromToken) return false;
        return walletAddressFromParameter.toLowerCase() === walletAddressFromToken;
    }

    getWalletAddressFromToken(request): string | undefined {
        const [type, token] = request.headers.authorization?.split(' ') ?? [];
        if (type !== 'Bearer') return;
        const payload = this.jwtService.verify(token, { secret: process.env.SESSION_SECRET });
        return payload.walletAddress;
    }
}

@Injectable()
export class AuthorizedUserGuard implements CanActivate {
    constructor(private readonly reflector: Reflector, private readonly jwtService: JwtService) {}

    canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
        const userParameter = this.reflector.get<string>(USER_PARAMETER, context.getHandler());
        if (!userParameter) return false;

        const ctx = GqlExecutionContext.create(context);
        const request: IGraphQLRequest = ctx.getContext().req;
        const userIdFromParameter = get(request.body.variables?.input, userParameter);
        const userIdFromToken = getUserIdFromToken(request.headers.authorization, this.jwtService, process.env.SESSION_SECRET);
        if (!userIdFromParameter || !userIdFromToken) return false;
        return userIdFromParameter === userIdFromToken;
    }
}

@Injectable()
export class SignatureGuard implements CanActivate {
    canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
        const ctx = GqlExecutionContext.create(context);
        const request: IGraphQLRequest = ctx.getContext().req;
        // these 3 parameters could be fixed, don't need to inject extenally
        const { address, message, signature } = request.body?.variables?.input || {};
        const addressFromSignature = ethers.verifyMessage(message, signature);
        if (address.toLowerCase() === addressFromSignature.toLowerCase()) return true;
        return false;
    }
}

@Injectable()
export class AuthorizedCollectionOwnerGuard implements CanActivate {
    constructor(
        private readonly reflector: Reflector,
        private readonly jwtService: JwtService,
        private readonly collectionService: CollectionService
    ) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const collectionIdParameter = this.reflector.get<string>(COLLECTION_ID_PARAMETER, context.getHandler());
        if (!collectionIdParameter) return false;

        const ctx = GqlExecutionContext.create(context);
        const request: IGraphQLRequest = ctx.getContext().req;
        const collectionIdFromParameter = get(request.body.variables?.input, collectionIdParameter);

        const collection = await this.collectionService.getCollection(collectionIdFromParameter);
        if (!collection) return false;

        const walletAddressFromToken = this.getWalletAddressFromToken(request);
        return walletAddressFromToken == collection.creator.address;
    }

    getWalletAddressFromToken(request): string | undefined {
        const [type, token] = request.headers.authorization?.split(' ') ?? [];
        if (type !== 'Bearer') return;
        const payload = this.jwtService.verify(token, { secret: process.env.SESSION_SECRET });
        return payload.walletAddress;
    }
}

@Injectable()
export class AuthorizedTokenGuard implements CanActivate {
    constructor(
        private readonly reflector: Reflector,
        private readonly collectionService: CollectionService,
        private readonly asset721Service: Asset721Service,
        private readonly mintSaleContractService: MintSaleContractService
    ) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const tokenIdParameter = this.reflector.get<string>(TOKEN_ID_PARAMETER, context.getHandler());
        const collectionIdParameter = this.reflector.get<string>(COLLECTION_ID_PARAMETER, context.getHandler());
        const ownerAddressParameter = this.reflector.get<string>(WALLET_ADDRESS_PARAMETER, context.getHandler());
        if (!tokenIdParameter || !collectionIdParameter || !ownerAddressParameter) return false;

        const ctx = GqlExecutionContext.create(context);
        const request: IGraphQLRequest = ctx.getContext().req;
        const tokenIdFromParameter = get(request.body.variables?.input, tokenIdParameter);
        const collectionIdFromParameter = get(request.body.variables?.input, collectionIdParameter);
        const ownerAddress = get(request.body.variables?.input, ownerAddressParameter, '').toLowerCase();

        const collection = await this.collectionService.getCollection(collectionIdFromParameter);
        if (!collection) return false;

        const mintSaleContract = await this.mintSaleContractService.getMintSaleContractByCollection(collection.id);
        if (!mintSaleContract) return false;

        const asset = await this.asset721Service.getAsset721({ tokenId: tokenIdFromParameter.toString(), address: mintSaleContract.tokenAddress });
        return asset && asset?.owner?.toLowerCase() === ownerAddress.toLowerCase();
    }
}

@Injectable()
export class AuthorizedOrganizationGuard implements CanActivate {
    constructor(
        private readonly reflector: Reflector,
        private readonly jwtService: JwtService,
        private readonly membershipService: MembershipService
    ) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const organizationIdParameter = this.reflector.get<string>(ORGANIZATION_ID_PARAMETER, context.getHandler());
        if (!organizationIdParameter) return false;

        const ctx = GqlExecutionContext.create(context);
        const request: IGraphQLRequest = ctx.getContext().req;
        const organizationIdFromParameter = get(request.body.variables?.input, organizationIdParameter);
        const userIdFromToken = getUserIdFromToken(request.headers.authorization, this.jwtService, process.env.SESSION_SECRET);
        if (!userIdFromToken) return false;

        return await this.membershipService.checkMembershipByOrganizationIdAndUserId(organizationIdFromParameter, userIdFromToken);
    }
}

@Injectable()
export class AuthorizedCollectionViewerGuard implements CanActivate {
    constructor(
        private readonly reflector: Reflector,
        private readonly jwtService: JwtService,
        private readonly collectionService: CollectionService,
        private readonly membershipService: MembershipService
    ) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const ctx = GqlExecutionContext.create(context);
        const request: IGraphQLRequest = ctx.getContext().req;
        const userId = getUserIdFromToken(request.headers.authorization, this.jwtService, process.env.SESSION_SECRET);
        if (!userId) return false;

        const variables = request.body.variables;
        const id = get(variables, 'id');
        const name = get(variables, 'name');
        const address = get(variables, 'address');
        const slug = get(variables, 'slug');

        const collection = await this.collectionService.getCollectionByQuery({ id, name, address, slug });

        const organizationId = collection?.organization?.id;
        if (!organizationId) return false;

        return await this.membershipService.checkMembershipByOrganizationIdAndUserId(organizationId, userId);
    }
}

@Injectable()
export class VibeEmailGuard implements CanActivate {
    constructor(private reflector: Reflector, private readonly jwtService: JwtService, private readonly userService: UserService) {}

    /**
     * Checks if the user is authenticated via the JWT token that registered with vibe email.
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
            const userId = getUserIdFromToken(request.headers.authorization, this.jwtService, process.env.SESSION_SECRET);
            const user = await this.userService.getUserByQuery({ id: userId });
            request.user = user;
            request.userId = userId;
            return user.email.endsWith(VIBE_EMAIL_SUFFIX);
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
}

// TODO: Update this OrganizationProtectionGuard:
//      1. Use the roles from the ctx.getContext()
//      2. Create a decorator to indicate the roles that can access the resource
//      3. Get the decorator's parameter and compare with the Session's roles
@Injectable()
export class OrganizationProtectionGuard implements CanActivate {
    constructor(private readonly membershipService: MembershipService) {}

    /**
     * Checks if the user is authenticated via the JWT token that registered with vibe email.
     *
     * @param context The execution context.
     * @returns {Promise<boolean>}
     */
    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = GqlExecutionContext.create(context).getContext().req;
        const membershipId = get(request.body.variables?.input, 'id');
        const membership = await this.membershipService.getMembershipWithOrganizationAndUser(membershipId);
        return membership?.organization?.owner.id !== membership.user.id;
    }
}
