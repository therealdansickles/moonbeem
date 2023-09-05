import * as dotenv from 'dotenv'; // see https://github.com/motdotla/dotenv#how-do-i-use-dotenv-with-import
import { CacheModule } from '@nestjs/cache-manager';
import { Module } from '@nestjs/common';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';

import { CollaborationModule } from './collaboration/collaboration.module';
import { CollectionModule } from './collection/collection.module';
import { RedisAdapter } from './lib/adapters/redis.adapter';
import { postgresConfig } from './lib/configs/db.config';
import { MembershipModule } from './membership/membership.module';
import { MoonpayModule } from './moonpay/moonpay.module';
import { NftModule } from './nft/nft.module';
import { OpenseaModule } from './opensea/opensea.module';
import { OrganizationModule } from './organization/organization.module';
import { PluginModule } from './plugin/plugin.module';
import { PollerModule } from './poller/poller.module';
import { RedeemModule } from './redeem/redeem.module';
import { RelationshipModule } from './relationship/relationship.module';
import { SaleHistoryModule } from './saleHistory/saleHistory.module';
import { SearchModule } from './search/search.module';
import { SessionGuard } from './session/session.guard';
import { SessionModule } from './session/session.module';
import { SyncChainModule } from './sync-chain/sync-chain.module';
import { UploadModule } from './upload/upload.module';
import { UserModule } from './user/user.module';
import { WaitlistModule } from './waitlist/waitlist.module';
import { WalletModule } from './wallet/wallet.module';
import { CoinMarketCapModule } from './coinmarketcap/coinmarketcap.module';
import { SessionInterceptor } from './session/session.interceptor';
import { CollectionPluginModule } from './collectionPlugin/collectionPlugin.module';

dotenv.config();

@Module({
    imports: [
        CollaborationModule,
        CollectionModule,
        MembershipModule,
        OrganizationModule,
        PollerModule,
        SearchModule,
        SessionModule,
        SyncChainModule,
        UploadModule,
        UserModule,
        WaitlistModule,
        WalletModule,
        RelationshipModule,
        OpenseaModule,
        MoonpayModule,
        RedeemModule,
        NftModule,
        CoinMarketCapModule,
        MoonpayModule,
        SaleHistoryModule,
        PluginModule,
        CollectionPluginModule,
        TypeOrmModule.forRoot({
            name: 'default',
            type: 'postgres',
            url: postgresConfig.url,
            autoLoadEntities: true,
            synchronize: false,
            logging: true,
        }),
        JwtModule.register({
            secret: process.env.SESSION_SECRET,
            signOptions: { expiresIn: '30d' },
        }),
        CacheModule.register({ isGlobal: true }),
    ],
    providers: [
        {
            provide: APP_INTERCEPTOR,
            useClass: SessionInterceptor,
        },
        {
            provide: APP_GUARD,
            useClass: SessionGuard,
        },
        RedisAdapter,
    ],
    exports: [],
})
export class ReplModule {}
