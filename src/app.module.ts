import { Module } from '@nestjs/common';
import { RpcClient } from 'src/lib/adapters/eth.client.adapter';
import { AppController } from './controllers/app.controller';
import { PostgresAdapter } from './lib/adapters/postgres.adapter';
import { RedisAdapter } from './lib/adapters/redis.adapter';
import { AuthModule } from './modules/auth.module';
import { MarketModule } from './modules/market.module';
import { UserWalletModule } from './modules/user.wallet.module';
import { AppService } from './services/app.service';
import { MarketService } from './services/market.service';
import { UserWalletService } from './services/user.wallet.service';

@Module({
    imports: [AuthModule, UserWalletModule, MarketModule],
    controllers: [AppController],
    providers: [AppService, MarketService, UserWalletService, RpcClient, RedisAdapter, PostgresAdapter],
    exports: [],
})
export class AppModule {}
