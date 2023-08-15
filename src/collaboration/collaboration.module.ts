import { forwardRef, Module } from '@nestjs/common';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';

import { CoinModule } from '../sync-chain/coin/coin.module';
import { Collection } from '../collection/collection.entity';
import { CollectionModule } from '../collection/collection.module';
import { Organization } from '../organization/organization.entity';
import { OrganizationModule } from '../organization/organization.module';
import { User } from '../user/user.entity';
import { UserModule } from '../user/user.module';
import { Wallet } from '../wallet/wallet.entity';
import { WalletModule } from '../wallet/wallet.module';
import { Collaboration } from './collaboration.entity';
import { CollaborationResolver } from './collaboration.resolver';
import { CollaborationService } from './collaboration.service';
import { RoyaltyModule } from '../sync-chain/royalty/royalty.module';
import { Royalty } from '../sync-chain/royalty/royalty.entity';
import { RoyaltyService } from '../sync-chain/royalty/royalty.service';

@Module({
    imports: [
        TypeOrmModule.forFeature([Collaboration, Collection, Organization, User, Wallet]),
        TypeOrmModule.forFeature([Royalty], 'sync_chain'),
        forwardRef(() => CollectionModule),
        forwardRef(() => OrganizationModule),
        forwardRef(() => UserModule),
        forwardRef(() => WalletModule),
        forwardRef(() => CoinModule),
        forwardRef(() => RoyaltyModule),
        JwtModule,
    ],
    providers: [JwtService, CollaborationService, CollaborationResolver, RoyaltyService],
    controllers: [],
    exports: [CollaborationModule, CollaborationService],
})
export class CollaborationModule {}
