import * as dotenv from 'dotenv'; // see https://github.com/motdotla/dotenv#how-do-i-use-dotenv-with-import
dotenv.config();

import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { ScheduleModule } from '@nestjs/schedule';
import { AppController } from './controllers/app.controller';
import { RpcClient } from './lib/adapters/eth.client.adapter';
import { MongoAdapter } from './lib/adapters/mongo.adapter';
import { PostgresAdapter } from './lib/adapters/postgres.adapter';
import { RedisAdapter } from './lib/adapters/redis.adapter';
import { appConfig } from './lib/configs/app.config';
import { AuthModule } from './modules/auth.module';
import { BetaWaitlistModule } from './modules/beta.waitlist.module';
import { LandingModule } from './modules/landing.modules';
import { MarketModule } from './modules/market.module';
import { PollerModule } from './modules/poller.module';
import { UserWalletModule } from './modules/user.wallet.module';
import { AppResolver } from './resolvers/app.resolver';
import { AppService } from './services/app.service';
import { MarketService } from './services/market.service';
import { UserWalletService } from './services/user.wallet.service';
import { UploadModule } from './modules/upload.module';
import { RavenModule, RavenInterceptor } from 'nest-raven';
import { APP_INTERCEPTOR } from '@nestjs/core';

@Module({
    imports: [
        AuthModule,
        RavenModule,
        UserWalletModule,
        MarketModule,
        BetaWaitlistModule,
        UploadModule,
        PollerModule,
        LandingModule,
        // integration graphql
        GraphQLModule.forRoot<ApolloDriverConfig>({
            driver: ApolloDriver, // GraphQL server adapter
            debug: appConfig.global.debug ? true : false, // is debug?
            playground: appConfig.global.debug ? true : false, // is show platground? waiting for fix: throw an error when set it true
            autoSchemaFile: 'schema.graphql', // schema file(auto generated)
        }),
        ScheduleModule.forRoot(),
    ],
    controllers: [AppController],
    providers: [
        {
            provide: APP_INTERCEPTOR,
            useValue: new RavenInterceptor(),
        },
        AppService,
        MarketService,
        UserWalletService,
        RpcClient,
        RedisAdapter,
        PostgresAdapter,
        MongoAdapter,
        AppResolver,
    ],
    exports: [],
})
export class AppModule {}
