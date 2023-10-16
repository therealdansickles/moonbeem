import { HttpModule } from '@nestjs/axios';
import { forwardRef, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CollectionPlugin } from '../collectionPlugin/collectionPlugin.entity';
import { Nft } from '../nft/nft.entity';
import { NftModule } from '../nft/nft.module';
import { NftService } from '../nft/nft.service';
import { Asset721 } from '../sync-chain/asset721/asset721.entity';
import { Asset721Module } from '../sync-chain/asset721/asset721.module';
import { MintSaleContract } from '../sync-chain/mint-sale-contract/mint-sale-contract.entity';
import { MintSaleTransaction } from '../sync-chain/mint-sale-transaction/mint-sale-transaction.entity';
import { MintSaleTransactionModule } from '../sync-chain/mint-sale-transaction/mint-sale-transaction.module';
import { MintSaleTransactionService } from '../sync-chain/mint-sale-transaction/mint-sale-transaction.service';
import { User } from '../user/user.entity';
import { UserModule } from '../user/user.module';
import { UserService } from '../user/user.service';
import { Wallet } from '../wallet/wallet.entity';
import { WalletModule } from '../wallet/wallet.module';
import { Collection } from '../collection/collection.entity';
import { CollectionService } from '../collection/collection.service';
import { AnalyticsService } from './analytics.service';
import { AnalyticsResolver } from './analytics.resolver';
import { CollectionModule } from '../collection/collection.module';

@Module({
    imports: [
        HttpModule,
        TypeOrmModule.forFeature([Collection, Nft, Wallet, User, CollectionPlugin]),
        TypeOrmModule.forFeature([MintSaleContract, MintSaleTransaction, Asset721], 'sync_chain'),
        forwardRef(() => Asset721Module),
        forwardRef(() => MintSaleTransactionModule),
        forwardRef(() => UserModule),
        forwardRef(() => WalletModule),
        forwardRef(() => NftModule),
        forwardRef(() => CollectionModule),
        JwtModule,
        ConfigModule,
    ],
    exports: [AnalyticsModule, AnalyticsService],
    providers: [UserService, CollectionService, MintSaleTransactionService, NftService, AnalyticsService, AnalyticsResolver],
    controllers: [],
})
export class AnalyticsModule {}
