import { Coin } from './coin.entity';
import { Module } from '@nestjs/common';
import { CoinService } from './coin.service';
import { CoinResolver } from './coin.resolver';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
    imports: [TypeOrmModule.forFeature([Coin], 'sync_chain')],
    exports: [CoinModule, CoinService],
    providers: [CoinResolver, CoinService],
})
export class CoinModule {}
