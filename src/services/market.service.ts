import { Injectable } from '@nestjs/common';
import { PostgresAdapter } from 'src/lib/adapters/postgres.adapter';
import { AuthPayload } from './auth.service';
import { UserWalletService } from './user.wallet.service';

@Injectable()
export class MarketService {
    constructor(private readonly pgClient: PostgresAdapter, private readonly userWallet: UserWalletService) {}

    async getAddressHoldings(address: string, payload?: AuthPayload) {
        // check address exists
        const userWallet = await this.userWallet.findOne(address);
        if (!userWallet) throw new Error('address not found');

        console.log('userWallet: ', userWallet);
        return userWallet;
    }
}
