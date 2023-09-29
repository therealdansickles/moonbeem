import { HttpModule } from '@nestjs/axios';
import { forwardRef, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AlchemyWebhook } from '../alchemy/alchemy-webhook.entity';
import { AlchemyModule } from '../alchemy/alchemy.module';
import { AlchemyService } from '../alchemy/alchemy.service';
import { CoinMarketCapModule } from '../coinmarketcap/coinmarketcap.module';
import { CoinMarketCapService } from '../coinmarketcap/coinmarketcap.service';
import { Collection } from '../collection/collection.entity';
import { CollectionModule } from '../collection/collection.module';
import { CollectionService } from '../collection/collection.service';
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
import { Plugin } from '../plugin/plugin.entity';
import { Asset721 } from '../sync-chain/asset721/asset721.entity';
import { Asset721Module } from '../sync-chain/asset721/asset721.module';
import { Asset721Service } from '../sync-chain/asset721/asset721.service';
import { Coin } from '../sync-chain/coin/coin.entity';
import { CoinModule } from '../sync-chain/coin/coin.module';
import { CoinService } from '../sync-chain/coin/coin.service';
import { Factory } from '../sync-chain/factory/factory.entity';
import { FactoryModule } from '../sync-chain/factory/factory.module';
import { FactoryService } from '../sync-chain/factory/factory.service';
import { History721 } from '../sync-chain/history721/history721.entity';
import { History721Module } from '../sync-chain/history721/history721.module';
import { MintSaleContract } from '../sync-chain/mint-sale-contract/mint-sale-contract.entity';
import { MintSaleContractModule } from '../sync-chain/mint-sale-contract/mint-sale-contract.module';
import { MintSaleContractService } from '../sync-chain/mint-sale-contract/mint-sale-contract.service';
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
import { SessionResolver } from './session.resolver';
import { SessionService } from './session.service';

@Module({
    imports: [
        TypeOrmModule.forFeature([Wallet, User, Collection, Membership, Organization, Tier, Nft, MerkleTree, CollectionPlugin, Plugin, AlchemyWebhook]),
        TypeOrmModule.forFeature([Asset721, Coin, MintSaleContract, MintSaleTransaction, History721, Factory], 'sync_chain'),
        forwardRef(() => Asset721Module),
        forwardRef(() => CoinMarketCapModule),
        forwardRef(() => CoinModule),
        forwardRef(() => CollectionModule),
        forwardRef(() => HttpModule),
        forwardRef(() => MailModule),
        forwardRef(() => MembershipModule),
        forwardRef(() => OpenseaModule),
        forwardRef(() => TierModule),
        forwardRef(() => UserModule),
        forwardRef(() => WalletModule),
        forwardRef(() => MintSaleTransactionModule),
        forwardRef(() => MintSaleContractModule),
        forwardRef(() => History721Module),
        forwardRef(() => FactoryModule),
        forwardRef(() => NftModule),
        forwardRef(() => CollectionPluginModule),
        forwardRef(() => AlchemyModule),
        forwardRef(() => MaasModule),
        JwtModule.register({
            secret: process.env.SESSION_SECRET,
            signOptions: { expiresIn: '7d' },
        }),
        ConfigModule,
        SessionModule,
    ],
    providers: [
        Asset721Service,
        CoinService,
        CollectionService,
        MembershipService,
        TierService,
        OpenseaService,
        SessionService,
        SessionResolver,
        CoinMarketCapService,
        MintSaleTransactionService,
        MintSaleContractService,
        FactoryService,
        NftService,
        CollectionPluginService,
        ConfigService,
        AlchemyService,
        MaasService,
    ],
    exports: [SessionModule, SessionResolver],
})
export class SessionModule {}
