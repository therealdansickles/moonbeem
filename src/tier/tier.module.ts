import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Collection } from '../collection/collection.entity';
import { CollectionModule } from '../collection/collection.module';
import { Tier } from './tier.entity';
import { TierService } from './tier.service';
import { TierResolver } from './tier.resolver';
import { Coin } from '../sync-chain/coin/coin.entity';
import { CoinModule } from '../sync-chain/coin/coin.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([Collection, Tier]),
        TypeOrmModule.forFeature([Coin], 'sync_chain'),
        forwardRef(() => CollectionModule),
        forwardRef(() => CoinModule),
    ],
    exports: [TierModule],
    providers: [TierService, TierResolver],
})
export class TierModule {}
