import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Collection } from '../collection/collection.entity';
import { Asset721 } from '../sync-chain/asset721/asset721.entity';
import { Asset721Module } from '../sync-chain/asset721/asset721.module';
import { Asset721Service } from '../sync-chain/asset721/asset721.service';
import { Tier } from '../tier/tier.entity';
import { Nft } from './nft.entity';
import { NftResolver } from './nft.resolver';
import { NftService } from './nft.service';

@Module({
    imports: [
        TypeOrmModule.forFeature([Nft, Tier, Collection]),
        TypeOrmModule.forFeature([Asset721], 'sync_chain'),
        forwardRef(() => Asset721Module),
    ],
    exports: [NftModule],
    providers: [Asset721Service, NftService, NftResolver],
})
export class NftModule {}
