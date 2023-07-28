import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Collaboration } from '../collaboration/collaboration.entity';
import { CollaborationModule } from '../collaboration/collaboration.module';
import { MailModule } from '../mail/mail.module';
import { Membership } from '../membership/membership.entity';
import { MembershipModule } from '../membership/membership.module';
import { Organization } from '../organization/organization.entity';
import { OrganizationModule } from '../organization/organization.module';
import { User } from './user.entity';
import { UserResolver } from './user.resolver';
import { UserService } from './user.service';
import { Wallet } from '../wallet/wallet.entity';
import { WalletModule } from '../wallet/wallet.module';
import { JwtModule } from '@nestjs/jwt/dist/jwt.module';
import { JwtService } from '@nestjs/jwt';
import { CollectionModule } from '../collection/collection.module';
import { Collection } from '../collection/collection.entity';
import { MintSaleTransactionModule } from '../sync-chain/mint-sale-transaction/mint-sale-transaction.module';
import { MintSaleTransaction } from '../sync-chain/mint-sale-transaction/mint-sale-transaction.entity';
import { Coin } from '../sync-chain/coin/coin.entity';
import { CoinModule } from '../sync-chain/coin/coin.module';
import { Tier } from '../tier/tier.entity';
import { TierModule } from '../tier/tier.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([User, Wallet, Membership, Organization, Collaboration, Collection, Tier]),
        TypeOrmModule.forFeature([MintSaleTransaction, Coin], 'sync_chain'),
        forwardRef(() => CollaborationModule),
        forwardRef(() => MailModule),
        forwardRef(() => CollectionModule),
        forwardRef(() => MembershipModule),
        forwardRef(() => OrganizationModule),
        forwardRef(() => WalletModule),
        forwardRef(() => MintSaleTransactionModule),
        forwardRef(() => CoinModule),
        forwardRef(() => TierModule),
        JwtModule,
    ],
    exports: [UserService],
    providers: [JwtService, UserService, UserResolver],
})
export class UserModule {}
