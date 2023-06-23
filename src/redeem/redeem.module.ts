import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt/dist/jwt.module';
import { JwtService } from '@nestjs/jwt';
import { Collection } from '../collection/collection.entity';
import { CollectionModule } from '../collection/collection.module';
import { Collaboration } from '../collaboration/collaboration.entity';
import { Organization } from '../organization/organization.entity';
import { Tier } from '../tier/tier.entity';
import { Wallet } from '../wallet/wallet.entity';
import { MintSaleContract } from '../sync-chain/mint-sale-contract/mint-sale-contract.entity';
import { Coin } from '../sync-chain/coin/coin.entity';
import { MintSaleTransaction } from '../sync-chain/mint-sale-transaction/mint-sale-transaction.entity';
import { Asset721 } from '../sync-chain/asset721/asset721.entity';
import { RedeemService } from './redeem.service';
import { Redeem } from './redeem.entity';
import { RedeemResolver } from './redeem.resolver';

@Module({
    imports: [
        TypeOrmModule.forFeature([Collaboration, Collection, Organization, Tier, Wallet, Redeem]),
        TypeOrmModule.forFeature([Coin, MintSaleContract, MintSaleTransaction, Asset721], 'sync_chain'),
        forwardRef(() => CollectionModule),
        JwtModule,
    ],
    providers: [JwtService, RedeemResolver, RedeemService],
})
export class RedeemModule {}
