import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt/dist/jwt.module';
import { JwtService } from '@nestjs/jwt';
import { Wallet } from '../wallet/wallet.entity';
import { UserModule } from '../user/user.module';
import { UserService } from '../user/user.service';
import { WalletModule } from '../wallet/wallet.module';
import { WalletService } from '../wallet/wallet.service';
import { Relationship } from '../relationship/relationship.entity';
import { Collaboration } from '../collaboration/collaboration.entity';
import { User } from '../user/user.entity';
import { Collection } from '../collection/collection.entity';
import { Tier } from '../tier/tier.entity';
import { MintSaleTransaction } from '../sync-chain/mint-sale-transaction/mint-sale-transaction.entity';
import { Coin } from '../sync-chain/coin/coin.entity';
import { MintSaleContract } from '../sync-chain/mint-sale-contract/mint-sale-contract.entity';
import { CoinModule } from '../sync-chain/coin/coin.module';
import { OrganizationModule } from '../organization/organization.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([Wallet, Relationship, User, Collaboration, Collection, Tier]),
        TypeOrmModule.forFeature([MintSaleTransaction, MintSaleContract, Coin], 'sync_chain'),
        forwardRef(() => WalletModule),
        forwardRef(() => UserModule),
        forwardRef(() => CoinModule),
        forwardRef(() => OrganizationModule),
        JwtModule,
    ],
    providers: [JwtService, WalletService, UserService]
})
export class AuthorizationModule { }
