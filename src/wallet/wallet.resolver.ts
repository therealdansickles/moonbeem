import { Resolver, Query, Args, Mutation, ResolveField, Parent } from '@nestjs/graphql';
import { GraphQLError } from 'graphql';
import {
    Wallet,
    BindWalletInput,
    UnbindWalletInput,
    CreateWalletInput,
    Minted,
    UpdateWalletInput,
    Activity,
    EstimatedValue,
} from './wallet.dto';
import { CurrentWallet, Public } from '../session/session.decorator';
import { WalletService } from './wallet.service';
import { Collection } from '../collection/collection.dto';
import { CollectionService } from '../collection/collection.service';
import { RelationshipService } from '../relationship/relationship.service';

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

    @Mutation(() => Wallet, { description: 'Binds a wallet to the current user.' })
    async bindWallet(@Args('input') input: BindWalletInput): Promise<Wallet> {
        return await this.walletService.bindWallet(input);
    }

    @Mutation(() => Wallet, { description: 'Unbinds a wallet from the current user.' })
    async unbindWallet(@Args('input') input: UnbindWalletInput): Promise<Wallet> {
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
    @ResolveField(() => [Minted], { description: 'Retrieves the minted NFTs for the given wallet.', nullable: true })
    async minted(@Parent() wallet: Wallet): Promise<Minted[]> {
        const minted = await this.walletService.getMintedByAddress(wallet.address);
        return minted;
    }

    @Public()
    @ResolveField(() => [Activity], { description: 'Retrieves the activity for the given wallet.', nullable: true })
    async activities(@Parent() wallet: Wallet): Promise<Activity[]> {
        const activities = await this.walletService.getActivitiesByAddress(wallet.address);
        return activities;
    }

    @Mutation(() => Wallet, { description: 'update the given wallet' })
    async updateWallet(@CurrentWallet() wallet, @Args('input') input: UpdateWalletInput): Promise<Wallet> {
        const { id, ...payload } = input;
        if (!id) throw new GraphQLError('The wallet id should be provided!');
        if (wallet && wallet.id !== id) {
            throw new GraphQLError("The wallet address doesn't belong to you.", {
                extensions: { code: 'INTERNAL_SERVER_ERROR' },
            });
        }
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
}
