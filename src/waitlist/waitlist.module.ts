import { forwardRef, Module } from '@nestjs/common';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';

import {
    MintSaleTransaction
} from '../sync-chain/mint-sale-transaction/mint-sale-transaction.entity';
import {
    MintSaleTransactionModule
} from '../sync-chain/mint-sale-transaction/mint-sale-transaction.module';
import { WalletModule } from '../wallet/wallet.module';
import { Waitlist } from './waitlist.entity';
import { WaitlistResolver } from './waitlist.resolver';
import { WaitlistService } from './waitlist.service';

@Module({
    imports: [
        TypeOrmModule.forFeature([Waitlist]),
        TypeOrmModule.forFeature([MintSaleTransaction], 'sync_chain'),
        forwardRef(() => MintSaleTransactionModule),
        forwardRef(() => WalletModule),
        JwtModule
    ],
    exports: [WaitlistModule],
    providers: [JwtService, WaitlistService, WaitlistResolver],
})
export class WaitlistModule {}
