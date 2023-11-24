import { forwardRef, Module } from '@nestjs/common';
import { ReferralResolver } from './referral.resolver';
import { ReferralService } from './referral.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NftModule } from '../nft/nft.module';
import { NftService } from '../nft/nft.service';
import { Nft } from '../nft/nft.entity';
import { Collection } from '../collection/collection.entity';
import { MerkleTree } from '../merkleTree/merkleTree.entity';
import { AlchemyService } from '../alchemy/alchemy.service';
import { Asset721Service } from '../sync-chain/asset721/asset721.service';
import { TierService } from '../tier/tier.service';
import { MaasService } from '../maas/maas.service';
import { AlchemyModule } from '../alchemy/alchemy.module';
import { Asset721Module } from '../sync-chain/asset721/asset721.module';
import { TierModule } from '../tier/tier.module';
import { MaasModule } from '../maas/maas.module';
import { ConfigService } from '@nestjs/config';
import { MintSaleContractModule } from '../sync-chain/mint-sale-contract/mint-sale-contract.module';
import { AlchemyWebhook } from '../alchemy/alchemy-webhook.entity';
import { CollectionService } from '../collection/collection.service';
import { CoinService } from '../sync-chain/coin/coin.service';
import { MembershipService } from '../membership/membership.service';
import { OpenseaService } from '../opensea/opensea.service';
import { CoinMarketCapService } from '../coinmarketcap/coinmarketcap.service';
import { MintSaleTransactionService } from '../sync-chain/mint-sale-transaction/mint-sale-transaction.service';
import { CollectionPluginService } from '../collectionPlugin/collectionPlugin.service';
import { RedeemService } from '../redeem/redeem.service';
import { OrganizationService } from '../organization/organization.service';
import { JwtService } from '@nestjs/jwt';
import { CoinMarketCapModule } from '../coinmarketcap/coinmarketcap.module';
import { CoinModule } from '../sync-chain/coin/coin.module';
import { CollaborationModule } from '../collaboration/collaboration.module';
import { MailModule } from '../mail/mail.module';
import { MembershipModule } from '../membership/membership.module';
import { MintSaleTransactionModule } from '../sync-chain/mint-sale-transaction/mint-sale-transaction.module';
import { OpenseaModule } from '../opensea/opensea.module';
import { OrganizationModule } from '../organization/organization.module';
import { UserModule } from '../user/user.module';
import { WalletModule } from '../wallet/wallet.module';
import { History721Module } from '../sync-chain/history721/history721.module';
import { CollectionPluginModule } from '../collectionPlugin/collectionPlugin.module';
import { RedeemModule } from '../redeem/redeem.module';
import { Collaboration } from '../collaboration/collaboration.entity';
import { Organization } from '../organization/organization.entity';
import { Membership } from '../membership/membership.entity';
import { Tier } from '../tier/tier.entity';
import { Wallet } from '../wallet/wallet.entity';
import { User } from '../user/user.entity';
import { Redeem } from '../redeem/redeem.entity';
import { Plugin } from '../plugin/plugin.entity';
import { CollectionPlugin } from '../collectionPlugin/collectionPlugin.entity';
import { Coin } from '../sync-chain/coin/coin.entity';
import { MintSaleContract } from '../sync-chain/mint-sale-contract/mint-sale-contract.entity';
import { MintSaleTransaction } from '../sync-chain/mint-sale-transaction/mint-sale-transaction.entity';
import { Asset721 } from '../sync-chain/asset721/asset721.entity';
import { History721 } from '../sync-chain/history721/history721.entity';
import { Referral } from './referral.entity';
import { HttpModule } from '@nestjs/axios';
import { FactoryModule } from '../sync-chain/factory/factory.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([
            Referral,
            Collaboration,
            Collection,
            Organization,
            Membership,
            Tier,
            Nft,
            Wallet,
            User,
            Redeem,
            Plugin,
            MerkleTree,
            CollectionPlugin,
            AlchemyWebhook,
            Redeem,
        ]),
        TypeOrmModule.forFeature([Coin, MintSaleContract, MintSaleTransaction, Asset721, History721], 'sync_chain'),
        HttpModule,
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
        forwardRef(() => CollectionPluginModule),
        forwardRef(() => MaasModule),
        forwardRef(() => RedeemModule),
        forwardRef(() => FactoryModule),
    ],
    exports: [ReferralModule],
    providers: [
        ReferralResolver,
        ReferralService,
        NftService,
        CollectionService,
        AlchemyService,
        Asset721Service,
        TierService,
        MaasService,
        ConfigService,
        JwtService,
        CoinService,
        MembershipService,
        OpenseaService,
        CoinMarketCapService,
        CollectionPluginService,
        RedeemService,
        OrganizationService,
        MintSaleTransactionService,
    ],
})

export class ReferralModule {
}
