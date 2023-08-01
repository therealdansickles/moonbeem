import { HttpModule } from '@nestjs/axios';
import { forwardRef, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';

import { CoinMarketCapModule } from '../coinmarketcap/coinmarketcap.module';
import { CoinMarketCapService } from '../coinmarketcap/coinmarketcap.service';
import { Collection } from '../collection/collection.entity';
import { CollectionModule } from '../collection/collection.module';
import { CollectionService } from '../collection/collection.service';
import { MailModule } from '../mail/mail.module';
import { Membership } from '../membership/membership.entity';
import { MembershipModule } from '../membership/membership.module';
import { MembershipService } from '../membership/membership.service';
import { OpenseaModule } from '../opensea/opensea.module';
import { OpenseaService } from '../opensea/opensea.service';
import { Organization } from '../organization/organization.entity';
import { Asset721 } from '../sync-chain/asset721/asset721.entity';
import { Asset721Module } from '../sync-chain/asset721/asset721.module';
import { Asset721Service } from '../sync-chain/asset721/asset721.service';
import { Coin } from '../sync-chain/coin/coin.entity';
import { CoinModule } from '../sync-chain/coin/coin.module';
import { CoinService } from '../sync-chain/coin/coin.service';
import { MintSaleContract } from '../sync-chain/mint-sale-contract/mint-sale-contract.entity';
import {
    MintSaleTransaction
} from '../sync-chain/mint-sale-transaction/mint-sale-transaction.entity';
import {
    MintSaleTransactionModule
} from '../sync-chain/mint-sale-transaction/mint-sale-transaction.module';
import {
    MintSaleTransactionService
} from '../sync-chain/mint-sale-transaction/mint-sale-transaction.service';
import { Tier } from '../tier/tier.entity';
import { TierModule } from '../tier/tier.module';
import { TierService } from '../tier/tier.service';
import { User } from '../user/user.entity';
import { UserModule } from '../user/user.module';
import { Wallet } from '../wallet/wallet.entity';
import { WalletModule } from '../wallet/wallet.module';
import { SessionResolver } from './session.resolver';
import { SessionService } from './session.service';

@Module({
    imports: [
        TypeOrmModule.forFeature([Wallet, User, Collection, Membership, Organization, Tier]),
        TypeOrmModule.forFeature([Asset721, Coin, MintSaleContract, MintSaleTransaction], 'sync_chain'),
        forwardRef(() => Asset721Module),
        forwardRef(() => CoinMarketCapModule),
        forwardRef(() => CoinModule),
        forwardRef(() => CollectionModule),
        forwardRef(() => HttpModule),
        forwardRef(() => MailModule),
        forwardRef(() => MembershipModule),
        forwardRef(() => OpenseaModule),
        forwardRef(() => TierModule),
        forwardRef(() => UserModule),
        forwardRef(() => WalletModule),
        forwardRef(() => MintSaleTransactionModule),
        JwtModule.register({
            secret: process.env.SESSION_SECRET,
            signOptions: { expiresIn: '1d' },
        }),
        SessionModule,
    ],
    providers: [
        Asset721Service,
        CoinService,
        CollectionService,
        MembershipService,
        TierService,
        OpenseaService,
        SessionService,
        SessionResolver,
        CoinMarketCapService,
        MintSaleTransactionService,
    ],
    exports: [SessionModule, SessionResolver],
})
export class SessionModule {}
