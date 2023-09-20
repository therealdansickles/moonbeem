import { HttpModule } from '@nestjs/axios';
import { forwardRef, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AlchemyModule } from '../alchemy/alchemy.module';
import { AlchemyService } from '../alchemy/alchemy.service';
import { CoinMarketCapModule } from '../coinmarketcap/coinmarketcap.module';
import { CoinMarketCapService } from '../coinmarketcap/coinmarketcap.service';
import { Collaboration } from '../collaboration/collaboration.entity';
import { CollaborationModule } from '../collaboration/collaboration.module';
import { MailModule } from '../mail/mail.module';
import { Membership } from '../membership/membership.entity';
import { MembershipModule } from '../membership/membership.module';
import { MembershipService } from '../membership/membership.service';
import { Nft } from '../nft/nft.entity';
import { NftModule } from '../nft/nft.module';
import { NftService } from '../nft/nft.service';
import { OpenseaModule } from '../opensea/opensea.module';
import { OpenseaService } from '../opensea/opensea.service';
import { Organization } from '../organization/organization.entity';
import { OrganizationModule } from '../organization/organization.module';
import { Redeem } from '../redeem/redeem.entity';
import { Asset721 } from '../sync-chain/asset721/asset721.entity';
import { Asset721Module } from '../sync-chain/asset721/asset721.module';
import { Asset721Service } from '../sync-chain/asset721/asset721.service';
import { Coin } from '../sync-chain/coin/coin.entity';
import { CoinModule } from '../sync-chain/coin/coin.module';
import { CoinService } from '../sync-chain/coin/coin.service';
import { History721 } from '../sync-chain/history721/history721.entity';
import { History721Module } from '../sync-chain/history721/history721.module';
import { MintSaleContract } from '../sync-chain/mint-sale-contract/mint-sale-contract.entity';
import { MintSaleContractModule } from '../sync-chain/mint-sale-contract/mint-sale-contract.module';
import { MintSaleTransaction } from '../sync-chain/mint-sale-transaction/mint-sale-transaction.entity';
import { MintSaleTransactionModule } from '../sync-chain/mint-sale-transaction/mint-sale-transaction.module';
import { MintSaleTransactionService } from '../sync-chain/mint-sale-transaction/mint-sale-transaction.service';
import { Tier } from '../tier/tier.entity';
import { TierModule } from '../tier/tier.module';
import { TierService } from '../tier/tier.service';
import { User } from '../user/user.entity';
import { UserModule } from '../user/user.module';
import { UserService } from '../user/user.service';
import { Wallet } from '../wallet/wallet.entity';
import { WalletModule } from '../wallet/wallet.module';
import { Collection } from './collection.entity';
import { CollectionResolver } from './collection.resolver';
import { CollectionService } from './collection.service';

@Module({
    imports: [
        HttpModule,
        TypeOrmModule.forFeature([Collaboration, Collection, Organization, Membership, Tier, Nft, Wallet, User, Redeem]),
        TypeOrmModule.forFeature([Coin, MintSaleContract, MintSaleTransaction, Asset721, History721], 'sync_chain'),
        forwardRef(() => Asset721Module),
        forwardRef(() => CoinMarketCapModule),
        forwardRef(() => CoinModule),
        forwardRef(() => CollaborationModule),
        forwardRef(() => MailModule),
        forwardRef(() => MembershipModule),
        forwardRef(() => MintSaleContractModule),
        forwardRef(() => MintSaleTransactionModule),
        forwardRef(() => OpenseaModule),
        forwardRef(() => OrganizationModule),
        forwardRef(() => TierModule),
        forwardRef(() => UserModule),
        forwardRef(() => WalletModule),
        forwardRef(() => History721Module),
        forwardRef(() => NftModule),
        forwardRef(() => AlchemyModule),
        JwtModule,
        ConfigModule,
    ],
    exports: [CollectionModule, CollectionService],
    providers: [
        JwtService,
        CoinService,
        MembershipService,
        OpenseaService,
        TierService,
        UserService,
        CollectionService,
        CollectionResolver,
        CoinMarketCapService,
        MintSaleTransactionService,
        NftService,
        Asset721Service,
        ConfigService,
        AlchemyService,
    ],
    controllers: [],
})
export class CollectionModule {}
