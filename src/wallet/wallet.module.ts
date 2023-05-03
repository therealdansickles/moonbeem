import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Wallet } from './wallet.entity';
import { WalletService } from './wallet.service';
import { WalletResolver } from './wallet.resolver';
import { User } from '../user/user.entity';
import { UserModule } from '../user/user.module';
import { Collaboration } from '../collaboration/collaboration.entity';
import { CollaborationModule } from '../collaboration/collaboration.module';
import { MintSaleTransaction } from '../sync-chain/mint-sale-transaction/mint-sale-transaction.entity';
import { MintSaleTransactionService } from '../sync-chain/mint-sale-transaction/mint-sale-transaction.service';
import { MintSaleTransactionModule } from '../sync-chain/mint-sale-transaction/mint-sale-transaction.module';
import { Tier } from '../tier/tier.entity';
import { TierModule } from '../tier/tier.module';
import { MintSaleContract } from '../sync-chain/mint-sale-contract/mint-sale-contract.entity';

@Module({
    imports: [
        TypeOrmModule.forFeature([Wallet, User, Collaboration, Tier]),
        TypeOrmModule.forFeature([MintSaleTransaction, MintSaleContract], 'sync_chain'),
        forwardRef(() => CollaborationModule),
        forwardRef(() => MintSaleTransactionModule),
        forwardRef(() => TierModule),
        forwardRef(() => UserModule),
    ],
    exports: [WalletModule],
    providers: [WalletService, WalletResolver],
    controllers: [],
})
export class WalletModule {}
