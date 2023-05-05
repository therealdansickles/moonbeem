import { Resolver, Query, Args, Mutation, ResolveField, Parent } from '@nestjs/graphql';
import {
    Wallet,
    BindWalletInput,
    UnbindWalletInput,
    CreateWalletInput,
    Minted,
    UpdateWalletInput,
    Activity,
} from './wallet.dto';
import { Public } from '../lib/decorators/public.decorator';
import { WalletService } from './wallet.service';

@Resolver(() => Wallet)
export class WalletResolver {
    constructor(private readonly walletService: WalletService) {}

    @Public()
    @Query((returns) => Wallet, {
        description: 'Retrieves a wallet by its ethereum or EIP-3770 address.',
        nullable: true,
    })
    async wallet(
        @Args('address', { description: 'an ethereum or EIP-3770 address.' }) address: string
    ): Promise<Wallet> {
        return await this.walletService.getWalletByAddress(address);
    }

    @Public()
    @Mutation(() => Wallet, { description: 'creates a wallet' })
    async createWallet(@Args('input') input: CreateWalletInput): Promise<Wallet> {
        return this.walletService.createWallet(input);
    }

    @Public()
    @Mutation((returns) => Wallet, { description: 'Binds a wallet to the current user.' })
    async bindWallet(@Args('input') input: BindWalletInput): Promise<Wallet> {
        return await this.walletService.bindWallet(input);
    }

    @Public()
    @Mutation((returns) => Wallet, { description: 'Unbinds a wallet from the current user.' })
    async unbindWallet(@Args('input') input: UnbindWalletInput): Promise<Wallet> {
        return await this.walletService.unbindWallet(input);
    }

    @Public()
    @ResolveField(() => [Minted], { description: 'Retrieves the minted NFTs for the given wallet.' })
    async minted(@Parent() wallet: Wallet): Promise<Minted[]> {
        const minted = await this.walletService.getMintedByAddress(wallet.address);
        return minted;
    }

    @Public()
    @ResolveField(() => [Activity], { description: 'Retrieves the activity for the given wallet.' })
    async activities(@Parent() wallet: Wallet): Promise<Activity[]> {
        const activities = await this.walletService.getMintedByAddress(wallet.address);
        return activities.map((activity) => ({ type: 'Mint', ...activity }));
    }

    @Public()
    @Mutation(() => Wallet, { description: 'update the given wallet' })
    async updateWallet(@Args('input') input: UpdateWalletInput): Promise<Wallet> {
        const { id, ...payload } = input;
        return await this.walletService.updateWallet(id, payload);
    }

    @ResolveField(() => String, {
        description: 'Retrieve the estimated value of a address holdings/minted collections by address.',
    })
    async estimatedValue(@Parent() wallet: Wallet): Promise<string> {
        return await this.walletService.getEstimatesByAddress(wallet.address);
    }
}
