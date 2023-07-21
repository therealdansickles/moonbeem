import { Test } from '@nestjs/testing';
import { ApolloDriver } from '@nestjs/apollo';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GraphQLModule, Query, Resolver } from '@nestjs/graphql';
import { postgresConfig } from './lib/configs/db.config';

// platform modules
import { CollaborationModule } from './collaboration/collaboration.module';
import { CollectionModule } from './collection/collection.module';
import { MailModule } from './mail/mail.module';
import { MembershipModule } from './membership/membership.module';
import { NftModule } from './nft/nft.module';
import { OrganizationModule } from './organization/organization.module';
import { RedeemModule } from './redeem/redeem.module';
import { RelationshipModule } from './relationship/relationship.module';
import { TierModule } from './tier/tier.module';
import { UserModule } from './user/user.module';
import { WalletModule } from './wallet/wallet.module';
import { MoonpayModule } from './moonpay/moonpay.module';
import { OpenseaModule } from './opensea/opensea.module';
import { PollerModule } from './poller/poller.module';
import { SaleHistoryModule } from './saleHistory/saleHistory.module';
import { SearchModule } from './search/search.module';
import { SessionModule } from './session/session.module';

// sync chain modules
import { Asset721Module } from './sync-chain/asset721/asset721.module';
import { CoinModule } from './sync-chain/coin/coin.module';
import { FactoryModule } from './sync-chain/factory/factory.module';
import { History721Module } from './sync-chain/history721/history721.module';
import { MintSaleContractModule } from './sync-chain/mint-sale-contract/mint-sale-contract.module';
import { MintSaleTransactionModule } from './sync-chain/mint-sale-transaction/mint-sale-transaction.module';
import { Record721Module } from './sync-chain/record721/record721.module';
import { RoyaltyModule } from './sync-chain/royalty/royalty.module';
import { SystemConfigModule } from './sync-chain/system-config/system-config.module';

// platform services
import { CollaborationService } from './collaboration/collaboration.service';
import { CollectionService } from './collection/collection.service';
import { MailService } from './mail/mail.service';
import { MembershipService } from './membership/membership.service';
import { NftService } from './nft/nft.service';
import { OrganizationService } from './organization/organization.service';
import { RedeemService } from './redeem/redeem.service';
import { RelationshipService } from './relationship/relationship.service';
import { TierService } from './tier/tier.service';
import { UserService } from './user/user.service';
import { WalletService } from './wallet/wallet.service';
import { SessionService } from './session/session.service';
import { MoonpayService } from './moonpay/moonpay.service';
import { PollerService } from './poller/poller.service';

// sync chain services
import { Asset721Service } from './sync-chain/asset721/asset721.service';
import { CoinService } from './sync-chain/coin/coin.service';
import { FactoryService } from './sync-chain/factory/factory.service';
import { History721Service } from './sync-chain/history721/history721.service';
import { MintSaleContractService } from './sync-chain/mint-sale-contract/mint-sale-contract.service';
import { MintSaleTransactionService } from './sync-chain/mint-sale-transaction/mint-sale-transaction.service';
import { Record721Service } from './sync-chain/record721/record721.service';
import { RoyaltyService } from './sync-chain/royalty/royalty.service';
import { SystemConfigService } from './sync-chain/system-config/system-config.service';
import { PluginService } from './plugin/plugin.service';
import { PluginModule } from './plugin/plugin.module';
import { SaleHistoryService } from './saleHistory/saleHistory.service';
import { SearchService } from './search/search.service';
import { WaitlistService } from './waitlist/waitlist.service';
import { WaitlistModule } from './waitlist/waitlist.module';
import { AWSAdapter } from './lib/adapters/aws.adapter';
import { HttpModule, HttpService } from '@nestjs/axios';
import { CurrentWallet } from './session/session.decorator';
import { Wallet } from './wallet/wallet.dto';
import { APP_GUARD } from '@nestjs/core';
import { SessionGuard } from './session/session.guard';
import { JwtService } from '@nestjs/jwt';
import { CoinMarketCapModule } from './coinmarketcap/coinmarketcap.module';

@Resolver()
export class TestResolver {
    @Query(() => String)
    test(@CurrentWallet() wallet: Wallet): string {
        return wallet.address;
    }
}

export default async () => {
    const module = await Test.createTestingModule({
        imports: [
            TypeOrmModule.forRoot({
                type: 'postgres',
                url: postgresConfig.url,
                logging: false,
                dropSchema: true,
                synchronize: true,
                autoLoadEntities: true,
            }),
            TypeOrmModule.forRoot({
                name: 'sync_chain',
                type: 'postgres',
                url: postgresConfig.syncChain.url,
                logging: false,
                dropSchema: true,
                synchronize: true,
                autoLoadEntities: true,
            }),
            HttpModule,
            // import platform modules
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
            TestResolver,
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
        ],
        providers: [
            AWSAdapter,
            {
                provide: APP_GUARD,
                useClass: SessionGuard,
            },
            JwtService,
        ],
    }).compile();

    // platform services
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

    // global function
    global.clearDatabase = clearDatabase;

    // global app
    process.env.MOONPAY_URL = 'https://mocked-url.com';
    process.env.MOONPAY_PK = 'mocked-public-key';
    process.env.MOONPAY_SK = 'mocked-secret-key';
    global.app = module.createNestApplication();
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
