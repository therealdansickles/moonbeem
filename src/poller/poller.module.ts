import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CollaborationModule } from '../collaboration/collaboration.module';
import { Collection } from '../collection/collection.entity';
import { MintSaleContract } from '../sync-chain/mint-sale-contract/mint-sale-contract.entity';
import { MintSaleContractModule } from '../sync-chain/mint-sale-contract/mint-sale-contract.module';
import { MintSaleTransaction } from '../sync-chain/mint-sale-transaction/mint-sale-transaction.entity';
import { MintSaleTransactionModule } from '../sync-chain/mint-sale-transaction/mint-sale-transaction.module';
import { Tier } from '../tier/tier.entity';
import { TierModule } from '../tier/tier.module';
import { PollerService } from './poller.service';
import { SharedModule } from '../share/share.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([MintSaleContract, MintSaleTransaction], 'sync_chain'),
        TypeOrmModule.forFeature([Collection, Tier]),
        forwardRef(() => CollaborationModule),
        forwardRef(() => TierModule),
        forwardRef(() => MintSaleContractModule),
        forwardRef(() => MintSaleTransactionModule),
        forwardRef(() => SharedModule),
    ],
    exports: [PollerModule, PollerService],
    providers: [PollerService],
})
export class PollerModule {}
