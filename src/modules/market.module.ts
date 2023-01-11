import { Module } from '@nestjs/common';
import { MarketController } from 'src/controllers/market.controller';
import { MarketResolver } from 'src/resolvers/market.resolver';
import { MarketService } from 'src/services/market.service';
import { UserWalletService } from 'src/services/user.wallet.service';
import { JWTModule } from './jwt.module';
import { SharedModule } from './share.module';

@Module({
    imports: [JWTModule, SharedModule],
    providers: [MarketService, UserWalletService, MarketResolver],
    controllers: [MarketController],
    exports: [],
})
export class MarketModule {}
