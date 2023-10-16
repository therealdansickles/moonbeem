import { ApolloDriver } from '@nestjs/apollo';
import { HttpModule, HttpService } from '@nestjs/axios';
import { CACHE_MANAGER, CacheModule } from '@nestjs/cache-manager';
import { ValidationPipe } from '@nestjs/common';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { GraphQLModule, Query, Resolver } from '@nestjs/graphql';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AlchemyController } from './alchemy/alchemy.controller';
import { AlchemyModule } from './alchemy/alchemy.module';
import { AlchemyService } from './alchemy/alchemy.service';
import { CoinMarketCapModule } from './coinmarketcap/coinmarketcap.module';
import { CoinMarketCapService } from './coinmarketcap/coinmarketcap.service';
// platform modules
import { CollaborationModule } from './collaboration/collaboration.module';
// platform services
import { CollaborationService } from './collaboration/collaboration.service';
import { CollectionModule } from './collection/collection.module';
import { CollectionService } from './collection/collection.service';
import { CollectionPluginModule } from './collectionPlugin/collectionPlugin.module';
import { CollectionPluginService } from './collectionPlugin/collectionPlugin.service';
import { AWSAdapter } from './lib/adapters/aws.adapter';
import { postgresConfig } from './lib/configs/db.config';
import { MaasService } from './maas/maas.service';
import { MailModule } from './mail/mail.module';
import { MailService } from './mail/mail.service';
import { MembershipModule } from './membership/membership.module';
import { MembershipService } from './membership/membership.service';
import { MerkleTreeModule } from './merkleTree/merkleTree.module';
import { MerkleTreeService } from './merkleTree/merkleTree.service';
import { MoonpayModule } from './moonpay/moonpay.module';
import { MoonpayService } from './moonpay/moonpay.service';
import { NftModule } from './nft/nft.module';
import { NftService } from './nft/nft.service';
import { OpenseaModule } from './opensea/opensea.module';
import { OpenseaService } from './opensea/opensea.service';
import { OrganizationModule } from './organization/organization.module';
import { OrganizationService } from './organization/organization.service';
import { PluginModule } from './plugin/plugin.module';
import { PluginService } from './plugin/plugin.service';
import { PollerModule } from './poller/poller.module';
import { PollerService } from './poller/poller.service';
import { RedeemModule } from './redeem/redeem.module';
import { RedeemService } from './redeem/redeem.service';
import { RelationshipModule } from './relationship/relationship.module';
import { RelationshipService } from './relationship/relationship.service';
import { SaleHistoryModule } from './saleHistory/saleHistory.module';
import { SaleHistoryService } from './saleHistory/saleHistory.service';
import { SearchModule } from './search/search.module';
import { SearchService } from './search/search.service';
import { CurrentWallet } from './session/session.decorator';
import { SessionGuard } from './session/session.guard';
import { SessionInterceptor } from './session/session.interceptor';
import { SessionModule } from './session/session.module';
import { SessionService } from './session/session.service';

// sync chain modules
import { Asset721Module } from './sync-chain/asset721/asset721.module';
// sync chain services
import { Asset721Service } from './sync-chain/asset721/asset721.service';
import { CoinModule } from './sync-chain/coin/coin.module';
import { CoinService } from './sync-chain/coin/coin.service';
import { FactoryModule } from './sync-chain/factory/factory.module';
import { FactoryService } from './sync-chain/factory/factory.service';
import { History721Module } from './sync-chain/history721/history721.module';
import { History721Service } from './sync-chain/history721/history721.service';
import { MintSaleContractModule } from './sync-chain/mint-sale-contract/mint-sale-contract.module';
import { MintSaleContractService } from './sync-chain/mint-sale-contract/mint-sale-contract.service';
import { MintSaleTransactionModule } from './sync-chain/mint-sale-transaction/mint-sale-transaction.module';
import { MintSaleTransactionService } from './sync-chain/mint-sale-transaction/mint-sale-transaction.service';
import { Record721Module } from './sync-chain/record721/record721.module';
import { Record721Service } from './sync-chain/record721/record721.service';
import { RoyaltyModule } from './sync-chain/royalty/royalty.module';
import { RoyaltyService } from './sync-chain/royalty/royalty.service';
import { SystemConfigModule } from './sync-chain/system-config/system-config.module';
import { SystemConfigService } from './sync-chain/system-config/system-config.service';
import { TierModule } from './tier/tier.module';
import { TierService } from './tier/tier.service';
import { UserModule } from './user/user.module';
import { UserService } from './user/user.service';
import { WaitlistModule } from './waitlist/waitlist.module';
import { WaitlistService } from './waitlist/waitlist.service';
import { Wallet } from './wallet/wallet.dto';
import { WalletModule } from './wallet/wallet.module';
import { WalletService } from './wallet/wallet.service';
import { AnalyticsModule } from './analytics/analytics.module';
import { AnalyticsService } from './analytics/analytics.service';

@Resolver()
export class TestResolver {
    @Query(() => String)
    test(@CurrentWallet() wallet: Wallet): string {
        return wallet.address;
    }
}

export default async () => {
    // Should abort if it's not a local database
    if (
        (!postgresConfig.url.includes('localhost') && !postgresConfig.url.includes('127.0.0.1')) ||
        (!postgresConfig.syncChain.url.includes('localhost') && !postgresConfig.syncChain.url.includes('127.0.0.1'))
    ) {
        throw new Error('You are not running tests on a local database. Aborting.');
    }
    const module = await Test.createTestingModule({
        imports: [
            TypeOrmModule.forRoot({
                type: 'postgres',
                url: postgresConfig.url,
                logging: false,
                synchronize: false,
                autoLoadEntities: true,
            }),
            TypeOrmModule.forRoot({
                name: 'sync_chain',
                type: 'postgres',
                url: postgresConfig.syncChain.url,
                logging: false,
                synchronize: false,
                autoLoadEntities: true,
            }),
            HttpModule,
            // import platform modules
            AlchemyModule,
            CollaborationModule,
            CollectionModule,
            MailModule,
            MembershipModule,
            NftModule,
            OrganizationModule,
            RedeemModule,
            RelationshipModule,
            TierModule,
            UserModule,
            WalletModule,
            SessionModule,
            MoonpayModule,
            OpenseaModule,
            CoinMarketCapModule,
            SaleHistoryModule,
            SearchModule,
            PollerModule,
            PluginModule,
            WaitlistModule,
            MerkleTreeModule,
            TestResolver,
            CollectionPluginModule,
            AnalyticsModule,
            // import sync modules
            Asset721Module,
            CoinModule,
            FactoryModule,
            History721Module,
            MintSaleContractModule,
            MintSaleTransactionModule,
            Record721Module,
            RoyaltyModule,
            SystemConfigModule,
            GraphQLModule.forRoot({
                driver: ApolloDriver,
                autoSchemaFile: true,
            }),
            CacheModule.register({
                isGlobal: true,
            }),
        ],
        providers: [
            AWSAdapter,
            {
                provide: APP_INTERCEPTOR,
                useClass: SessionInterceptor,
            },
            {
                provide: APP_GUARD,
                useClass: SessionGuard,
            },
            JwtService,
        ],
    }).compile();

    // platform services
    global.alchemyService = module.get<AlchemyService>(AlchemyService);
    global.collaborationService = module.get<CollaborationService>(CollaborationService);
    global.collectionService = module.get<CollectionService>(CollectionService);
    global.mailService = module.get<MailService>(MailService);
    global.membershipService = module.get<MembershipService>(MembershipService);
    global.moonPayService = module.get<MoonpayService>(MoonpayService);
    global.nftService = module.get<NftService>(NftService);
    global.organizationService = module.get<OrganizationService>(OrganizationService);
    global.pluginService = module.get<PluginService>(PluginService);
    global.pollerService = module.get<PollerService>(PollerService);
    global.redeemService = module.get<RedeemService>(RedeemService);
    global.relationshipService = module.get<RelationshipService>(RelationshipService);
    global.saleHistoryService = module.get<SaleHistoryService>(SaleHistoryService);
    global.searchService = module.get<SearchService>(SearchService);
    global.sessionService = module.get<SessionService>(SessionService);
    global.tierService = module.get<TierService>(TierService);
    global.userService = module.get<UserService>(UserService);
    global.waitlistService = module.get<WaitlistService>(WaitlistService);
    global.walletService = module.get<WalletService>(WalletService);
    global.merkleTreeService = module.get<MerkleTreeService>(MerkleTreeService);
    global.openseaService = module.get<OpenseaService>(OpenseaService);
    global.coinmarketcapService = module.get<CoinMarketCapService>(CoinMarketCapService);
    global.jwtService = module.get<JwtService>(JwtService);
    global.collectionPluginService = module.get<CollectionPluginService>(CollectionPluginService);
    global.maasService = module.get<MaasService>(MaasService);
    global.analyticsService = module.get<AnalyticsService>(AnalyticsService);

    // platform controller
    global.alchemyController = module.get<AlchemyController>(AlchemyController);

    // sync chain services
    global.asset721Service = module.get<Asset721Service>(Asset721Service);
    global.coinService = module.get<CoinService>(CoinService);
    global.factoryService = module.get<FactoryService>(FactoryService);
    global.history721Service = module.get<History721Service>(History721Service);
    global.mintSaleContractService = module.get<MintSaleContractService>(MintSaleContractService);
    global.mintSaleTransactionService = module.get<MintSaleTransactionService>(MintSaleTransactionService);
    global.record721Service = module.get<Record721Service>(Record721Service);
    global.royaltyService = module.get<RoyaltyService>(RoyaltyService);
    global.systemConfigService = module.get<SystemConfigService>(SystemConfigService);

    // platform repositories
    global.nftRepository = module.get('NftRepository');
    global.userRepository = module.get('UserRepository');
    global.tierRepository = module.get('TierRepository');
    global.walletRepository = module.get('WalletRepository');
    global.redeemRepository = module.get('RedeemRepository');
    global.pluginRepository = module.get('PluginRepository');
    global.waitlistRepository = module.get('WaitlistRepository');
    global.collectionRepository = module.get('CollectionRepository');
    global.membershipRepository = module.get('MembershipRepository');
    global.OrganizationRepository = module.get('OrganizationRepository');
    global.relationshipRepository = module.get('RelationshipRepository');
    global.collaborationRepository = module.get('CollaborationRepository');
    global.merkleTreeRepository = module.get('MerkleTreeRepository');
    global.collectionPluginRepository = module.get('CollectionPluginRepository');
    global.alchemyWebhookRepository = module.get('AlchemyWebhookRepository');

    // sync chain repositories
    global.asset721Repository = module.get('sync_chain_Asset721Repository');
    global.coinRepository = module.get('sync_chain_CoinRepository');
    global.factoryRepository = module.get('sync_chain_FactoryRepository');
    global.history721Repository = module.get('sync_chain_History721Repository');
    global.mintSaleContractRepository = module.get('sync_chain_MintSaleContractRepository');
    global.mintSaleTransactionRepository = module.get('sync_chain_MintSaleTransactionRepository');
    global.record721Repository = module.get('sync_chain_Record721Repository');
    global.royaltyRepository = module.get('sync_chain_RoyaltyRepository');
    global.systemConfigRepository = module.get('sync_chain_SystemConfigRepository');

    global.awsAdapter = module.get<AWSAdapter>(AWSAdapter);
    global.httpService = module.get<HttpService>(HttpService);
    global.cacheManager = module.get(CACHE_MANAGER);

    // global function
    global.clearDatabase = clearDatabase;

    // global app
    process.env.MOONPAY_URL = 'https://mocked-url.com';
    process.env.MOONPAY_PK = 'mocked-public-key';
    process.env.MOONPAY_SK = 'mocked-secret-key';
    global.app = module.createNestApplication().useGlobalPipes(
        new ValidationPipe({
            whitelist: true,
            transform: true,
        }),
    );
    await global.app.init();
};

async function clearDatabase() {
    // platform database clear
    await global.collaborationRepository.query('TRUNCATE TABLE "Collaboration" CASCADE;');
    await global.collectionRepository.query('TRUNCATE TABLE "Collection" CASCADE;');
    await global.membershipRepository.query('TRUNCATE TABLE "Membership" CASCADE;');
    await global.nftRepository.query('TRUNCATE TABLE "Nft" CASCADE;');
    await global.OrganizationRepository.query('TRUNCATE TABLE "Organization" CASCADE;');
    await global.redeemRepository.query('TRUNCATE TABLE "Redeem" CASCADE;');
    await global.relationshipRepository.query('TRUNCATE TABLE "Relationship" CASCADE;');
    await global.tierRepository.query('TRUNCATE TABLE "Tier" CASCADE;');
    await global.userRepository.query('TRUNCATE TABLE "User" CASCADE;');
    await global.walletRepository.query('TRUNCATE TABLE "Wallet" CASCADE;');
    await global.pluginRepository.query('TRUNCATE TABLE "Plugin" CASCADE;');
    await global.collectionPluginRepository.query('TRUNCATE TABLE "CollectionPlugin" CASCADE;');
    await global.alchemyWebhookRepository.query('TRUNCATE TABLE "AlchemyWebhook" CASCADE;');

    // sync chain database clear
    await global.asset721Repository.query('TRUNCATE TABLE "Asset721" CASCADE;');
    await global.coinRepository.query('TRUNCATE TABLE "Coin" CASCADE;');
    await global.factoryRepository.query('TRUNCATE TABLE "Factory" CASCADE;');
    await global.history721Repository.query('TRUNCATE TABLE "History721" CASCADE;');
    await global.mintSaleContractRepository.query('TRUNCATE TABLE "MintSaleContract" CASCADE;');
    await global.mintSaleTransactionRepository.query('TRUNCATE TABLE "MintSaleTransaction" CASCADE;');
    await global.record721Repository.query('TRUNCATE TABLE "Record721" CASCADE;');
    await global.royaltyRepository.query('TRUNCATE TABLE "Royalty" CASCADE;');
    await global.systemConfigRepository.query('TRUNCATE TABLE "SystemConfig" CASCADE;');
}
