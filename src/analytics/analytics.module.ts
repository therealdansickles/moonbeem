import { HttpModule } from '@nestjs/axios';
import { forwardRef, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AlchemyWebhook } from '../alchemy/alchemy-webhook.entity';
import { AlchemyModule } from '../alchemy/alchemy.module';
import { AlchemyService } from '../alchemy/alchemy.service';
import { CoinMarketCapModule } from '../coinmarketcap/coinmarketcap.module';
import { CoinMarketCapService } from '../coinmarketcap/coinmarketcap.service';
import { Collaboration } from '../collaboration/collaboration.entity';
import { CollaborationModule } from '../collaboration/collaboration.module';
import { CollectionPlugin } from '../collectionPlugin/collectionPlugin.entity';
import { CollectionPluginModule } from '../collectionPlugin/collectionPlugin.module';
import { CollectionPluginService } from '../collectionPlugin/collectionPlugin.service';
import { MaasModule } from '../maas/maas.module';
import { MaasService } from '../maas/maas.service';
import { MailModule } from '../mail/mail.module';
import { Membership } from '../membership/membership.entity';
import { MembershipModule } from '../membership/membership.module';
import { MembershipService } from '../membership/membership.service';
import { MerkleTree } from '../merkleTree/merkleTree.entity';
import { Nft } from '../nft/nft.entity';
import { NftModule } from '../nft/nft.module';
import { NftService } from '../nft/nft.service';
import { OpenseaModule } from '../opensea/opensea.module';
import { OpenseaService } from '../opensea/opensea.service';
import { Organization } from '../organization/organization.entity';
import { OrganizationModule } from '../organization/organization.module';
import { Plugin } from '../plugin/plugin.entity';
import { Redeem } from '../redeem/redeem.entity';
import { Asset721 } from '../sync-chain/asset721/asset721.entity';
import { Asset721Module } from '../sync-chain/asset721/asset721.module';
import { Asset721Service } from '../sync-chain/asset721/asset721.service';
import { Coin } from '../sync-chain/coin/coin.entity';
import { CoinModule } from '../sync-chain/coin/coin.module';
import { CoinService } from '../sync-chain/coin/coin.service';
import { History721 } from '../sync-chain/history721/history721.entity';
import { History721Module } from '../sync-chain/history721/history721.module';
import { MintSaleContract } from '../sync-chain/mint-sale-contract/mint-sale-contract.entity';
import { MintSaleContractModule } from '../sync-chain/mint-sale-contract/mint-sale-contract.module';
import { MintSaleTransaction } from '../sync-chain/mint-sale-transaction/mint-sale-transaction.entity';
import { MintSaleTransactionModule } from '../sync-chain/mint-sale-transaction/mint-sale-transaction.module';
import { MintSaleTransactionService } from '../sync-chain/mint-sale-transaction/mint-sale-transaction.service';
import { Tier } from '../tier/tier.entity';
import { TierModule } from '../tier/tier.module';
import { TierService } from '../tier/tier.service';
import { User } from '../user/user.entity';
import { UserModule } from '../user/user.module';
import { Wallet } from '../wallet/wallet.entity';
import { WalletModule } from '../wallet/wallet.module';
import { Collection } from '../collection/collection.entity';
import { CollectionService } from '../collection/collection.service';
import { AnalyticsService } from './analytics.service';
import { AnalyticsResolver } from './analytics.resolver';

@Module({
    imports: [
        HttpModule,
        TypeOrmModule.forFeature([
            Collaboration,
            Collection,
            Organization,
            Membership,
            Tier,
            Nft,
            Wallet,
            User,
            Redeem,
            Plugin,
            MerkleTree,
            CollectionPlugin,
            AlchemyWebhook,
        ]),
        TypeOrmModule.forFeature([Coin, MintSaleContract, MintSaleTransaction, Asset721, History721], 'sync_chain'),
        forwardRef(() => Asset721Module),
        forwardRef(() => CoinMarketCapModule),
        forwardRef(() => CoinModule),
        forwardRef(() => CollaborationModule),
        forwardRef(() => MailModule),
        forwardRef(() => MembershipModule),
        forwardRef(() => MintSaleContractModule),
        forwardRef(() => MintSaleTransactionModule),
        forwardRef(() => OpenseaModule),
        forwardRef(() => OrganizationModule),
        forwardRef(() => TierModule),
        forwardRef(() => UserModule),
        forwardRef(() => WalletModule),
        forwardRef(() => History721Module),
        forwardRef(() => NftModule),
        forwardRef(() => AlchemyModule),
        forwardRef(() => CollectionPluginModule),
        forwardRef(() => MaasModule),
        JwtModule,
        ConfigModule,
    ],
    exports: [AnalyticsModule, AnalyticsService],
    providers: [
        JwtService,
        CoinService,
        MembershipService,
        OpenseaService,
        TierService,
        CollectionService,
        CoinMarketCapService,
        MintSaleTransactionService,
        NftService,
        Asset721Service,
        ConfigService,
        AlchemyService,
        CollectionPluginService,
        MaasService,
        AnalyticsService,
        AnalyticsResolver,
    ],
    controllers: [],
})
export class AnalyticsModule {}
