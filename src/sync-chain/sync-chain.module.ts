import { ConfigModule, ConfigService } from '@nestjs/config';

import { Asset721Module } from './asset721/asset721.module';
import { CoinModule } from './coin/coin.module';
import { FactoryModule } from './factory/factory.module';
import { History721Module } from './history721/history721.module';
import { MintSaleContractModule } from './mint-sale-contract/mint-sale-contract.module';
import { MintSaleTransactionModule } from './mint-sale-transaction/mint-sale-transaction.module';
import { Module } from '@nestjs/common';
import { Record721Module } from './record721/record721.module';
import { RoyaltyModule } from './royalty/royalty.module';
import { SystemConfigModule } from './system-config/system-config.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import configuration from '../../config';

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
        ConfigModule.forRoot({
            isGlobal: true,
            cache: true,
            load: [configuration]
        }),
        TypeOrmModule.forRootAsync({
            name: 'sync_chain',
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: (configService: ConfigService) => ({
                name: configService.get('syncChainPostgresConfig.name'),
                type: configService.get('syncChainPostgresConfig.type'),
                url: configService.get('syncChainPostgresConfig.url'),
                autoLoadEntities: configService.get('syncChainPostgresConfig.autoLoadEntities'),
                synchronize: configService.get('syncChainPostgresConfig.synchronize'),
                logging: configService.get('syncChainPostgresConfig.logging'),
            })
        }),
    ],
    controllers: [],
    providers: [],
    exports: [],
})
export class SyncChainModule {}
