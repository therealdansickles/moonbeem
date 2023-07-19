import { Coin } from './coin.entity';
import { forwardRef, Module } from '@nestjs/common';
import { CoinService } from './coin.service';
import { CoinResolver } from './coin.resolver';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CoinMarketCapService } from '../../coinmarketcap/coinmarketcap.service';
import { OpenseaModule } from '../../opensea/opensea.module';
import { HttpModule } from '@nestjs/axios';

@Module({
    imports: [TypeOrmModule.forFeature([Coin], 'sync_chain'), HttpModule, forwardRef(() => OpenseaModule)],
    exports: [CoinModule, CoinService],
    providers: [CoinResolver, CoinService, CoinMarketCapService],
})
export class CoinModule {}
