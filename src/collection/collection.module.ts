import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Collaboration } from '../collaboration/collaboration.entity';
import { CollaborationModule } from '../collaboration/collaboration.module';
import { Collection } from './collection.entity';
import { CollectionService } from './collection.service';
import { CollectionResolver } from './collection.resolver';
import { Organization } from '../organization/organization.entity';
import { OrganizationModule } from '../organization/organization.module';
import { MintSaleContract } from '../sync-chain/mint-sale-contract/mint-sale-contract.entity';
import { MintSaleContractModule } from '../sync-chain/mint-sale-contract/mint-sale-contract.module';
import { MintSaleTransaction } from '../sync-chain/mint-sale-transaction/mint-sale-transaction.entity';
import { MintSaleTransactionService } from '../sync-chain/mint-sale-transaction/mint-sale-transaction.service';
import { MintSaleTransactionModule } from '../sync-chain/mint-sale-transaction/mint-sale-transaction.module';
import { Tier } from '../tier/tier.entity';
import { TierModule } from '../tier/tier.module';
import { Wallet } from '../wallet/wallet.entity';
import { WalletModule } from '../wallet/wallet.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([Collaboration, Collection, Organization, Tier, Wallet]),
        TypeOrmModule.forFeature([MintSaleContract, MintSaleTransaction], 'sync_chain'),
        forwardRef(() => CollaborationModule),
        forwardRef(() => MintSaleContractModule),
        forwardRef(() => MintSaleTransactionModule),
        forwardRef(() => OrganizationModule),
        forwardRef(() => TierModule),
        forwardRef(() => WalletModule),
    ],
    exports: [CollectionModule, CollectionService],
    providers: [CollectionService, CollectionResolver],
    controllers: [],
})
export class CollectionModule {}
