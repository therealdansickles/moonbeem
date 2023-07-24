import { Coin } from './coin.entity';
import { forwardRef, Module } from '@nestjs/common';
import { CoinService } from './coin.service';
import { CoinResolver } from './coin.resolver';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CoinMarketCapService } from '../../coinmarketcap/coinmarketcap.service';
import { OpenseaModule } from '../../opensea/opensea.module';
import { HttpModule } from '@nestjs/axios';
import { CoinMarketCapModule } from '../../coinmarketcap/coinmarketcap.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([Coin], 'sync_chain'),
        HttpModule,
        forwardRef(() => OpenseaModule),
        forwardRef(() => CoinMarketCapModule),
    ],
    exports: [CoinModule, CoinService],
    providers: [CoinResolver, CoinService, CoinMarketCapService],
})
export class CoinModule {}
