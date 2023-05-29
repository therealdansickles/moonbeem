import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Wallet } from './wallet.entity';
import { WalletService } from './wallet.service';
import { WalletResolver } from './wallet.resolver';
import { User } from '../user/user.entity';
import { UserModule } from '../user/user.module';
import { JwtModule } from '@nestjs/jwt';
import { Collaboration } from '../collaboration/collaboration.entity';
import { CollaborationModule } from '../collaboration/collaboration.module';
import { MintSaleTransaction } from '../sync-chain/mint-sale-transaction/mint-sale-transaction.entity';
import { MintSaleTransactionService } from '../sync-chain/mint-sale-transaction/mint-sale-transaction.service';
import { MintSaleTransactionModule } from '../sync-chain/mint-sale-transaction/mint-sale-transaction.module';
import { Tier } from '../tier/tier.entity';
import { TierModule } from '../tier/tier.module';
import { MintSaleContract } from '../sync-chain/mint-sale-contract/mint-sale-contract.entity';
import { Collection } from '../collection/collection.entity';
import { CollectionModule } from '../collection/collection.module';
import { Coin } from '../sync-chain/coin/coin.entity';
import { CoinModule } from '../sync-chain/coin/coin.module';
import { Relationship } from '../relationship/relationship.entity';
import { RelationshipModule } from '../relationship/relationship.module';
import { RelationshipService } from '../relationship/relationship.service';

@Module({
    imports: [
        TypeOrmModule.forFeature([Wallet, Relationship, User, Collaboration, Collection, Tier]),
        TypeOrmModule.forFeature([MintSaleTransaction, MintSaleContract, Coin], 'sync_chain'),
        forwardRef(() => CollaborationModule),
        forwardRef(() => CollectionModule),
        forwardRef(() => MintSaleTransactionModule),
        forwardRef(() => RelationshipModule),
        forwardRef(() => TierModule),
        forwardRef(() => UserModule),
        forwardRef(() => CoinModule),
    ],
    exports: [WalletModule, WalletService],
    providers: [RelationshipService, WalletService, WalletResolver],
    controllers: [],
})
export class WalletModule { }
