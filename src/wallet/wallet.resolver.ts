import { GraphQLError } from 'graphql';

import { UseGuards } from '@nestjs/common';
import { Args, Int, Mutation, Parent, Query, ResolveField, Resolver } from '@nestjs/graphql';

import { Collection } from '../collection/collection.dto';
import { CollectionService } from '../collection/collection.service';
import { RelationshipService } from '../relationship/relationship.service';
import { AuthorizedWallet, CurrentWallet, Public } from '../session/session.decorator';
import { SigninByEmailGuard } from '../session/session.guard';
import {
    Activity,
    BindWalletInput,
    CreateWalletInput,
    EstimatedValue,
    MintPaginated,
    UnbindWalletInput,
    UpdateWalletInput,
    Wallet,
    WalletSoldPaginated,
} from './wallet.dto';
import { WalletService } from './wallet.service';
import { Profit } from '../tier/tier.dto';

@Resolver(() => Wallet)
export class WalletResolver {
    constructor(
        private readonly walletService: WalletService,
        private readonly collectionService: CollectionService,
        private readonly relationshipService: RelationshipService
    ) {}

    @Public()
    @Query(() => Wallet, {
        description: 'Retrieves a wallet by its ethereum or EIP-3770 address.',
        nullable: true,
    })
    async wallet(
        @Args('address', { description: 'an ethereum or EIP-3770 address.', nullable: true }) address: string,
        @Args('name', { description: 'a name of the wallet.', nullable: true }) name: string
    ): Promise<Wallet> {
        return this.walletService.getWalletByQuery({ name, address });
    }

    @Public()
    @Mutation(() => Wallet, { description: 'creates a wallet' })
    async createWallet(@Args('input') input: CreateWalletInput): Promise<Wallet> {
        return this.walletService.createWallet(input);
    }

    @UseGuards(SigninByEmailGuard)
    @Mutation(() => Wallet, { description: 'Binds a wallet to the current user.' })
    async bindWallet(@Args('input') input: BindWalletInput): Promise<Wallet> {
        return await this.walletService.bindWallet(input);
    }

    @Mutation(() => Wallet, { description: 'Unbinds a wallet from the current user.' })
    async unbindWallet(@CurrentWallet() wallet, @Args('input') input: UnbindWalletInput): Promise<Wallet> {
        await this.walletService.getWalletByQuery({ address: input.address });
        return await this.walletService.unbindWallet(input);
    }

    @Public()
    @ResolveField(() => Number, { description: 'The total count of followers.' })
    async followersTotal(@Parent() wallet: Wallet): Promise<number> {
        const followersTotal = await this.relationshipService.countFollowersByAddress(wallet.address);
        return followersTotal;
    }

    @Public()
    @ResolveField(() => Number, { description: 'The total count of followings.' })
    async followingsTotal(@Parent() wallet: Wallet): Promise<number> {
        const followingsTotal = await this.relationshipService.countFollowingsByAddress(wallet.address);
        return followingsTotal;
    }

    @Public()
    @ResolveField(() => MintPaginated, {
        description: 'Retrieves the minted NFTs for the given wallet.',
        nullable: true,
    })
    async minted(
        @Parent() wallet: Wallet,
        @Args('before', { nullable: true }) before?: string,
        @Args('after', { nullable: true }) after?: string,
        @Args('first', { type: () => Int, nullable: true, defaultValue: 10 }) first?: number,
        @Args('last', { type: () => Int, nullable: true, defaultValue: 10 }) last?: number
    ): Promise<MintPaginated> {
        const minted = await this.walletService.getMintedByAddress(wallet.address, before, after, first, last);
        return minted;
    }

    @Public()
    @ResolveField(() => [Activity], { description: 'Retrieves the activity for the given wallet.', nullable: true })
    async activities(@Parent() wallet: Wallet): Promise<Activity[]> {
        const activities = await this.walletService.getActivitiesByAddress(wallet.address);
        return activities;
    }

    @AuthorizedWallet('id')
    @Mutation(() => Wallet, { description: 'update the given wallet' })
    async updateWallet(@Args('input') input: UpdateWalletInput): Promise<Wallet> {
        const { id, ...payload } = input;
        if (!id) throw new GraphQLError('The wallet id should be provided!');
        return await this.walletService.updateWallet(id, payload);
    }

    @Public()
    @ResolveField(() => [EstimatedValue], {
        description: 'Retrieve the estimated value of a address holdings/minted collections by address.',
    })
    async estimatedValue(@Parent() wallet: Wallet): Promise<EstimatedValue[]> {
        return await this.walletService.getEstimatesByAddress(wallet.address);
    }

    @Public()
    @ResolveField(() => [Collection], { description: 'Retrieve the owned collections by the wallet address.' })
    async createdCollections(@Parent() wallet: Wallet): Promise<Collection[]> {
        return await this.collectionService.getCreatedCollectionsByWalletId(wallet.id);
    }

    @Public()
    @ResolveField(() => WalletSoldPaginated)
    async sold(
        @Parent() wallet: Wallet,
        @Args('before', { nullable: true }) before?: string,
        @Args('after', { nullable: true }) after?: string,
        @Args('first', { type: () => Int, nullable: true, defaultValue: 10 }) first?: number,
        @Args('last', { type: () => Int, nullable: true, defaultValue: 10 }) last?: number
    ): Promise<WalletSoldPaginated> {
        return await this.walletService.getSold(wallet.address, before, after, first, last);
    }

    @Public()
    @ResolveField(() => [Profit], { description: 'Returns the total raised for the given wallet' })
    async profit(@Parent() wallet: Wallet): Promise<Profit[]> {
        return await this.walletService.getWalletProfit(wallet.address);
    }
}
