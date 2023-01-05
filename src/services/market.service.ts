import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { PostgresAdapter } from 'src/lib/adapters/postgres.adapter';
import { UserWalletService } from './user.wallet.service';

@Injectable()
export class MarketService {
    constructor(private readonly pgClient: PostgresAdapter, private readonly userWallet: UserWalletService) {}

    async getAddressHoldings(address: string) {
        // check address exists
        const userWallet = await this.userWallet.findOne(address);
        if (!userWallet) throw new HttpException('address not found', HttpStatus.SERVICE_UNAVAILABLE);

        return userWallet;
    }
}
