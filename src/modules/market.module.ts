import { Module } from '@nestjs/common';
import { MarketController } from '../controllers/market.controller';
import { MarketResolver } from '../resolvers/market.resolver';
import { MarketService } from '../services/market.service';
import { UserWalletService } from '../services/user.wallet.service';
import { JWTModule } from './jwt.module';
import { SharedModule } from './share.module';

@Module({
    imports: [JWTModule, SharedModule],
    providers: [MarketService, UserWalletService, MarketResolver],
    controllers: [MarketController],
    exports: [],
})
export class MarketModule {}
