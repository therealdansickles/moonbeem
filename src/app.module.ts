import { Module } from '@nestjs/common';
import { RpcClient } from 'src/lib/adapters/eth.client.adapter';
import { AppController } from './controllers/api.controller';
import { MarketController } from './controllers/market.controller';
import { PostgresAdapter } from './lib/adapters/postgres.adapter';
import { RedisAdapter } from './lib/adapters/redis.adapter';
import { AuthModule } from './modules/auth.module';
import { UserWalletModule } from './modules/user.wallet.module';
import { AppService } from './services/api.service';
import { MarketService } from './services/market.service';

@Module({
    imports: [UserWalletModule, AuthModule],
    controllers: [AppController, MarketController],
    providers: [AppService, MarketService, RpcClient, RedisAdapter, PostgresAdapter],
    exports: [],
})
export class AppModule {}
