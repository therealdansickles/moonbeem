import { Collection } from '../collection/collection.entity';
import { Module } from '@nestjs/common';
import { Nft } from './nft.entity';
import { NftResolver } from './nft.resolver';
import { NftService } from './nft.service';
import { Tier } from '../tier/tier.entity';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
    imports: [TypeOrmModule.forFeature([Nft, Tier, Collection])],
    exports: [NftModule],
    providers: [NftService, NftResolver],
})
export class NftModule { }
