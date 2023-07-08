import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { NftActivityController } from './nftActivity.controller';
import { NftActivityService } from './nftActivity.service';
import { Update } from './nftActivity.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NftModule } from '../nft/nft.module';
import { CollectionModule } from '../collection/collection.module';
import { NftService } from '../nft/nft.service';
import { Nft } from '../nft/nft.entity';

@Module({
    imports: [
        HttpModule,
        NftModule,
        CollectionModule,
        NftModule,
        TypeOrmModule.forFeature([Update]),
        TypeOrmModule.forFeature([Nft])
    ],
    exports: [
        TypeOrmModule,
        NftActivityModule,
        NftActivityService],
    providers: [
        NftActivityService,
        NftService],
    controllers: [NftActivityController],

})
export class NftActivityModule { }
