import { HttpModule } from '@nestjs/axios';
import { forwardRef, Module } from '@nestjs/common';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CoinMarketCapService } from '../coinmarketcap/coinmarketcap.service';
import { Collection } from '../collection/collection.entity';
import { CollectionModule } from '../collection/collection.module';

import { MailModule } from '../mail/mail.module';
import { Organization } from '../organization/organization.entity';
import { OrganizationModule } from '../organization/organization.module';
import { OrganizationService } from '../organization/organization.service';
import { Coin } from '../sync-chain/coin/coin.entity';
import { CoinModule } from '../sync-chain/coin/coin.module';
import { CoinService } from '../sync-chain/coin/coin.service';
import { MintSaleTransaction } from '../sync-chain/mint-sale-transaction/mint-sale-transaction.entity';
import { MintSaleTransactionModule } from '../sync-chain/mint-sale-transaction/mint-sale-transaction.module';
import { MintSaleTransactionService } from '../sync-chain/mint-sale-transaction/mint-sale-transaction.service';
import { User } from '../user/user.entity';
import { UserModule } from '../user/user.module';
import { Membership } from './membership.entity';
import { MembershipResolver } from './membership.resolver';
import { MembershipService } from './membership.service';

@Module({
    imports: [
        HttpModule,
        TypeOrmModule.forFeature([Membership, Organization, User, Collection]),
        TypeOrmModule.forFeature([MintSaleTransaction, Coin], 'sync_chain'),
        forwardRef(() => OrganizationModule),
        forwardRef(() => UserModule),
        forwardRef(() => MailModule),
        forwardRef(() => CollectionModule),
        forwardRef(() => MintSaleTransactionModule),
        forwardRef(() => CoinModule),
        JwtModule,
    ],
    exports: [MembershipModule, MembershipService],
    providers: [
        JwtService,
        MembershipService,
        MembershipResolver,
        OrganizationService,
        MintSaleTransactionService,
        CoinService,
        CoinMarketCapService,
    ],
    controllers: [],
})
export class MembershipModule {}
