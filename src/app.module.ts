import * as dotenv from 'dotenv'; // see https://github.com/motdotla/dotenv#how-do-i-use-dotenv-with-import
dotenv.config();

import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { GraphQLModule } from '@nestjs/graphql';
import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { TypeOrmModule } from '@nestjs/typeorm';

import { CollaborationModule } from './collaboration/collaboration.module';
import { CollectionModule } from './collection/collection.module';
import { JwtModule } from '@nestjs/jwt';
import { MembershipModule } from './membership/membership.module';
import { MongoAdapter } from './lib/adapters/mongo.adapter';
import { OrganizationModule } from './organization/organization.module';
import { PollerModule } from './poller/poller.module';
import { RavenModule, RavenInterceptor } from 'nest-raven';
import { RedisAdapter } from './lib/adapters/redis.adapter';
import { RelationshipModule } from './relationship/relationship.module';
import { SearchModule } from './search/search.module';
import { SessionModule } from './session/session.module';
import { SyncChainModule } from './sync-chain/sync-chain.module';
import { UploadModule } from './modules/upload.module';
import { UserModule } from './user/user.module';
import { WaitlistModule } from './waitlist/waitlist.module';
import { WalletModule } from './wallet/wallet.module';
import { appConfig } from './lib/configs/app.config';
import { postgresConfig } from './lib/configs/db.config';
import { SessionGuard } from './session/session.guard';
import { OpenseaModule } from './opensea/opensea.module';

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
        // integration graphql
        GraphQLModule.forRoot<ApolloDriverConfig>({
            driver: ApolloDriver, // GraphQL server adapter
            debug: appConfig.global.debug ? true : false, // is debug?
            playground: appConfig.global.debug ? true : false, // is show platground? waiting for fix: throw an error when set it true
            autoSchemaFile: true,
        }),
        ScheduleModule.forRoot(),
        TypeOrmModule.forRoot({
            name: 'default',
            type: 'postgres',
            url: postgresConfig.url,
            autoLoadEntities: true,
            synchronize: true,
            logging: true,
        }),
        JwtModule.register({
            secret: process.env.SESSION_SECRET,
            signOptions: { expiresIn: '1d' },
        }),
        OpenseaModule,
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
