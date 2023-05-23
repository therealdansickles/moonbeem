import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WalletModule } from "../wallet/wallet.module";
// import { Wallet } from "../wallet/wallet.entity";
import { Coin } from '../sync-chain/coin/coin.entity'
import { MintSaleContract } from '../sync-chain/mint-sale-contract/mint-sale-contract.entity';
import { MintSaleTransaction } from "../sync-chain/mint-sale-transaction/mint-sale-transaction.entity";
import { Relationship } from './relationship.entity';
import { RelationshipService } from "./relationship.service";
import { RelationshipResolver } from "./relationship.resolver";

@Module({
  imports: [
    TypeOrmModule.forFeature([Relationship]),
    forwardRef(() => WalletModule),
  ],
  exports: [RelationshipModule],
  providers: [RelationshipService, RelationshipResolver],
})
export class RelationshipModule { }
