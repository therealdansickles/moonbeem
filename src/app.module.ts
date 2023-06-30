import { RavenInterceptor, RavenModule } from 'nest-raven';

import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { GraphQLModule } from '@nestjs/graphql';
import { JwtModule } from '@nestjs/jwt';
import { ScheduleModule } from '@nestjs/schedule';
import { TypeOrmModule } from '@nestjs/typeorm';

import configuration from '../config';
import { CollaborationModule } from './collaboration/collaboration.module';
import { CollectionModule } from './collection/collection.module';
import { MongoAdapter } from './lib/adapters/mongo.adapter';
import { RedisAdapter } from './lib/adapters/redis.adapter';
import { appConfig } from './lib/configs/app.config';
import { MembershipModule } from './membership/membership.module';
import { UploadModule } from './modules/upload.module';
import { MoonpayModule } from './moonpay/moonpay.module';
import { NftModule } from './nft/nft.module';
import { OpenseaModule } from './opensea/opensea.module';
import { OrganizationModule } from './organization/organization.module';
import { PollerModule } from './poller/poller.module';
import { RedeemModule } from './redeem/redeem.module';
import { RelationshipModule } from './relationship/relationship.module';
import { SaleHistoryModule } from './saleHistory/saleHistory.module';
import { SearchModule } from './search/search.module';
import { SessionGuard } from './session/session.guard';
import { SessionModule } from './session/session.module';
import { SyncChainModule } from './sync-chain/sync-chain.module';
import { UserModule } from './user/user.module';
import { WaitlistModule } from './waitlist/waitlist.module';
import { WalletModule } from './wallet/wallet.module';

@Module({
    imports: [
        CollaborationModule,
        CollectionModule,
        MembershipModule,
        OrganizationModule,
        PollerModule,
        RavenModule,
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
        ConfigModule.forRoot({
            isGlobal: true,
            cache: true,
            load: [configuration]
        }),
        // integration graphql
        GraphQLModule.forRoot<ApolloDriverConfig>({
            driver: ApolloDriver, // GraphQL server adapter
            debug: appConfig.global.debug ? true : false, // is debug?
            playground: appConfig.global.debug ? true : false, // is show platground? waiting for fix: throw an error when set it true
            autoSchemaFile: true,
        }),
        ScheduleModule.forRoot(),
        TypeOrmModule.forRootAsync({
            name: 'default',
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: (configService: ConfigService) => ({
                name: configService.get('platformPostgresConfig.name'),
                type: configService.get('platformPostgresConfig.type'),
                url: configService.get('platformPostgresConfig.url'),
                autoLoadEntities: configService.get('platformPostgresConfig.autoLoadEntities'),
                synchronize: configService.get('platformPostgresConfig.synchronize'),
                logging: configService.get('platformPostgresConfig.logging'),
            })
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
        JwtModule.register({
            secret: process.env.SESSION_SECRET,
            signOptions: { expiresIn: '1d' },
        }),
        OpenseaModule,
        MoonpayModule,
        SaleHistoryModule,
    ],
    providers: [
        {
            provide: APP_INTERCEPTOR,
            useValue: new RavenInterceptor(),
        },
        {
            provide: APP_GUARD,
            useClass: SessionGuard,
        },
        MongoAdapter,
        RedisAdapter,
    ],
    exports: [],
})
export class AppModule {}
