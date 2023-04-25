import { Resolver, Query, Args, Mutation } from '@nestjs/graphql';
import { Wallet, BindWalletInput, UnbindWalletInput, CreateWalletInput } from './wallet.dto';
import { Public } from '../lib/decorators/public.decorator';
import { WalletService } from './wallet.service';

@Resolver('Wallet')
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

    @Mutation((returns) => Wallet, { description: 'Binds a wallet to the current user.' })
    async bindWallet(@Args('input') input: BindWalletInput): Promise<Wallet> {
        return await this.walletService.bindWallet(input);
    }

    @Public()
    @Mutation((returns) => Wallet, { description: 'Unbinds a wallet from the current user.' })
    async unbindWallet(@Args('input') input: UnbindWalletInput): Promise<Wallet> {
        return await this.walletService.unbindWallet(input);
    }
}
