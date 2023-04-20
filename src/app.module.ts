import * as dotenv from 'dotenv'; // see https://github.com/motdotla/dotenv#how-do-i-use-dotenv-with-import
dotenv.config();

import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { GraphQLModule } from '@nestjs/graphql';
import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { TypeOrmModule } from '@nestjs/typeorm';
import { postgresConfig } from './lib/configs/db.config';
import { appConfig } from './lib/configs/app.config';
import { RavenModule, RavenInterceptor } from 'nest-raven';
import { APP_INTERCEPTOR } from '@nestjs/core';

import { AppController } from './controllers/app.controller';
import { AppResolver } from './resolvers/app.resolver';
import { AppService } from './services/app.service';
import { AuthModule } from './auth/auth.module';
import { BetaWaitlistModule } from './modules/beta.waitlist.module';
import { CollaborationModule } from './collaboration/collaboration.module';
import { CollectionModule } from './collection/collection.module';
import { LandingModule } from './modules/landing.modules';
import { MarketModule } from './modules/market.module';
import { MarketService } from './services/market.service';
import { MembershipModule } from './membership/membership.module';
import { MongoAdapter } from './lib/adapters/mongo.adapter';
import { OrganizationModule } from './organization/organization.module';
import { PollerModule } from './modules/poller.module';
import { PostgresAdapter } from './lib/adapters/postgres.adapter';
import { RedisAdapter } from './lib/adapters/redis.adapter';
import { RpcClient } from './lib/adapters/eth.client.adapter';
import { SearchModule } from './modules/search.module';
import { UploadModule } from './modules/upload.module';
import { UserModule } from './user/user.module';
import { UserWalletModule } from './modules/user.wallet.module';
import { UserWalletService } from './services/user.wallet.service';
import { WalletModule } from './wallet/wallet.module';

@Module({
    imports: [
        AuthModule,
        BetaWaitlistModule,
        CollaborationModule,
        CollectionModule,
        LandingModule,
        MarketModule,
        MembershipModule,
        OrganizationModule,
        PollerModule,
        RavenModule,
        SearchModule,
        UploadModule,
        UserModule,
        UserWalletModule,
        WalletModule,
        // integration graphql
        GraphQLModule.forRoot<ApolloDriverConfig>({
            driver: ApolloDriver, // GraphQL server adapter
            debug: appConfig.global.debug ? true : false, // is debug?
            playground: appConfig.global.debug ? true : false, // is show platground? waiting for fix: throw an error when set it true
            autoSchemaFile: 'schema.graphql', // schema file(auto generated)
        }),
        ScheduleModule.forRoot(),
        TypeOrmModule.forRoot({
            type: 'postgres',
            url: postgresConfig.url,
            autoLoadEntities: true,
            synchronize: true,
            logging: true,
        }),
    ],
    controllers: [AppController],
    providers: [
        {
            provide: APP_INTERCEPTOR,
            useValue: new RavenInterceptor(),
        },
        AppResolver,
        AppService,
        MarketService,
        MongoAdapter,
        PostgresAdapter,
        RedisAdapter,
        RpcClient,
        UserWalletService,
    ],
    exports: [],
})
export class AppModule {}
