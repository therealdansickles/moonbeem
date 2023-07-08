import { Module, forwardRef } from '@nestjs/common';

import { Asset721 } from '../sync-chain/asset721/asset721.entity';
import { Asset721Module } from '../sync-chain/asset721/asset721.module';
import { Asset721Service } from '../sync-chain/asset721/asset721.service';
import { Coin } from '../sync-chain/coin/coin.entity';
import { Collection } from '../collection/collection.entity';
import { CollectionModule } from '../collection/collection.module';
import { CollectionService } from '../collection/collection.service';
import { HttpModule } from '@nestjs/axios';
import { JwtModule } from '@nestjs/jwt';
import { MintSaleContract } from '../sync-chain/mint-sale-contract/mint-sale-contract.entity';
import { MintSaleTransaction } from '../sync-chain/mint-sale-transaction/mint-sale-transaction.entity';
import { OpenseaModule } from '../opensea/opensea.module';
import { OpenseaService } from '../opensea/opensea.service';
import { SessionResolver } from './session.resolver';
import { SessionService } from './session.service';
import { Tier } from '../tier/tier.entity';
import { TierModule } from '../tier/tier.module';
import { TierService } from '../tier/tier.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../user/user.entity';
import { UserModule } from '../user/user.module';
import { Wallet } from '../wallet/wallet.entity';
import { WalletModule } from '../wallet/wallet.module';
import { AlchemyModule } from '../alchemy/alchemy.module';
import { AlchemyService } from '../alchemy/alchemy.service';

@Module({
    imports: [
        TypeOrmModule.forFeature([Wallet, User, Collection, Tier]),
        TypeOrmModule.forFeature([Asset721, Coin, MintSaleContract, MintSaleTransaction], 'sync_chain'),
        forwardRef(() => UserModule),
        forwardRef(() => WalletModule),
        forwardRef(() => Asset721Module),
        forwardRef(() => CollectionModule),
        forwardRef(() => TierModule),
        forwardRef(() => OpenseaModule),
        forwardRef(() => AlchemyModule),
        forwardRef(() => HttpModule),
        JwtModule.register({
            secret: process.env.SESSION_SECRET,
            signOptions: { expiresIn: '1d' },
        }),
        SessionModule,
    ],
    providers: [Asset721Service, CollectionService, TierService, OpenseaService, AlchemyService, SessionService, SessionResolver],
    exports: [SessionModule, SessionResolver],
})
export class SessionModule { }
