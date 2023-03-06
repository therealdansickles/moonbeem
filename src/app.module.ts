import * as dotenv from 'dotenv'; // see https://github.com/motdotla/dotenv#how-do-i-use-dotenv-with-import
dotenv.config();

import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { RpcClient } from './lib/adapters/eth.client.adapter.js';
import { AppController } from './controllers/app.controller.js';
import { PostgresAdapter } from './lib/adapters/postgres.adapter.js';
import { RedisAdapter } from './lib/adapters/redis.adapter.js';
import { appConfig } from './lib/configs/app.config.js';
import { AuthModule } from './modules/auth.module.js';
import { MarketModule } from './modules/market.module.js';
import { UserWalletModule } from './modules/user.wallet.module.js';
import { AppService } from './services/app.service.js';
import { MarketService } from './services/market.service.js';
import { UserWalletService } from './services/user.wallet.service.js';
import { AppResolver } from './resolvers/app.resolver.js';
import { MongoAdapter } from './lib/adapters/mongo.adapter.js';
import { BetaWaitlistModule } from './modules/beta.waitlist.module.js';
import { UploadModule } from './modules/upload.module.js';
import { AWSAdapter } from './lib/adapters/aws.adapter.js';
import { ScheduleModule } from '@nestjs/schedule';
import { PollerService } from './services/poller.service.js';

@Module({
    imports: [
        AuthModule,
        UserWalletModule,
        MarketModule,
        BetaWaitlistModule,
        UploadModule,
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
    providers: [AppService, MarketService, UserWalletService, RpcClient, RedisAdapter, PostgresAdapter, PollerService, MongoAdapter, AppResolver, AWSAdapter],
    exports: [],
})
export class AppModule {}
