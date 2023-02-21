import { Module } from '@nestjs/common';
import { MarketController } from '../controllers/market.controller.js';
import { MarketResolver } from '../resolvers/market.resolver.js';
import { MarketService } from '../services/market.service.js';
import { UserWalletService } from '../services/user.wallet.service.js';
import { JWTModule } from './jwt.module.js';
import { SharedModule } from './share.module.js';

@Module({
    imports: [JWTModule, SharedModule],
    providers: [MarketService, UserWalletService, MarketResolver],
    controllers: [MarketController],
    exports: [],
})
export class MarketModule {}
