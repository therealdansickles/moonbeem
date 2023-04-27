import { Module } from '@nestjs/common';
import { FactoryModule } from './factory/factory.module';
import { RoyaltyModule } from './royalty/royalty.module';
import { Asset721Module } from './asset721/asset721.module';
import { History721Module } from './history721/history721.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { postgresConfig } from '../lib/configs/db.config';
import { CoinModule } from './coin/coin.module';
import { SystemConfigModule } from './system-config/system-config.module';
import { MintSaleTransactionModule } from './mint-sale-transaction/mint-sale-transaction.module';
import { MintSaleContractModule } from './mint-sale-contract/mint-sale-contract.module';
import { Record721Module } from './record721/record721.module';
import { ApolloDriverConfig, ApolloDriver } from '@nestjs/apollo';
import { GraphQLModule } from '@nestjs/graphql';
import { appConfig } from '../lib/configs/app.config';

@Module({
    imports: [
        FactoryModule,
        RoyaltyModule,
        Asset721Module,
        Record721Module,
        History721Module,
        CoinModule,
        SystemConfigModule,
        MintSaleContractModule,
        MintSaleTransactionModule,
        GraphQLModule.forRoot<ApolloDriverConfig>({
            driver: ApolloDriver, // GraphQL server adapter
            debug: appConfig.global.debug ? true : false, // is debug?
            playground: appConfig.global.debug ? true : false, // is show platground? waiting for fix: throw an error when set it true
            autoSchemaFile: 'schema.graphql', // schema file(auto generated)
        }),
        TypeOrmModule.forRoot({
            name: 'sync_chain',
            type: 'postgres',
            url: postgresConfig.syncChain.url,
            autoLoadEntities: true,
            synchronize: true,
            logging: true,
        }),
    ],
    controllers: [],
    providers: [],
    exports: [],
})
export class SyncChainModule {}
