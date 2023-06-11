import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { FactoryModule } from './factory/factory.module';
import { RoyaltyModule } from './royalty/royalty.module';
import { Asset721Module } from './asset721/asset721.module';
import { History721Module } from './history721/history721.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CoinModule } from './coin/coin.module';
import { SystemConfigModule } from './system-config/system-config.module';
import { MintSaleTransactionModule } from './mint-sale-transaction/mint-sale-transaction.module';
import { MintSaleContractModule } from './mint-sale-contract/mint-sale-contract.module';
import { Record721Module } from './record721/record721.module';
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
