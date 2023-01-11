import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { RpcClient } from 'src/lib/adapters/eth.client.adapter';
import { AppController } from './controllers/app.controller';
import { PostgresAdapter } from './lib/adapters/postgres.adapter';
import { RedisAdapter } from './lib/adapters/redis.adapter';
import { appConfig } from './lib/configs/app.config';
import { AuthModule } from './modules/auth.module';
import { MarketModule } from './modules/market.module';
import { UserWalletModule } from './modules/user.wallet.module';
import { AppService } from './services/app.service';
import { MarketService } from './services/market.service';
import { UserWalletService } from './services/user.wallet.service';
import { ApolloServerPluginLandingPageLocalDefault } from 'apollo-server-core';
import { AppResolver } from './resolvers/app.resolver';
import { DirectiveLocation, GraphQLDirective } from 'graphql';
import { AuthResolver } from './resolvers/auth.resolver';

@Module({
    imports: [
        AuthModule,
        UserWalletModule,
        MarketModule,
        // integration graphql
        GraphQLModule.forRoot<ApolloDriverConfig>({
            driver: ApolloDriver, // GraphQL server adapter
            debug: appConfig.global.debug ? true : false, // is debug?
            playground: appConfig.global.debug ? true : false, // is show platground? waiting for fix: throw an error when set it true
            autoSchemaFile: 'schema.graphql', // schema file(auto generated)
        }),
    ],
    controllers: [AppController],
    providers: [AppService, MarketService, UserWalletService, RpcClient, RedisAdapter, PostgresAdapter, AppResolver],
    exports: [],
})
export class AppModule {}
