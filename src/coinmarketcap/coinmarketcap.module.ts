import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { CoinMarketCapService } from './coinmarketcap.service';

@Module({
    imports: [HttpModule],
    providers: [CoinMarketCapService],
})
export class CoinMarketCapModule {}
