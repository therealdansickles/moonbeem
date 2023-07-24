import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MintSaleContract } from '../sync-chain/mint-sale-contract/mint-sale-contract.entity';
import { MintSaleContractModule } from '../sync-chain/mint-sale-contract/mint-sale-contract.module';
import { MintSaleTransaction } from '../sync-chain/mint-sale-transaction/mint-sale-transaction.entity';
import { MintSaleTransactionModule } from '../sync-chain/mint-sale-transaction/mint-sale-transaction.module';
import { MerkleTree } from './merkleTree.entity';
import { MerkleTreeResolver } from './merkleTree.resolver';
import { MerkleTreeService } from './merkleTree.service';

@Module({
    imports: [
        TypeOrmModule.forFeature([MerkleTree]),
        TypeOrmModule.forFeature([MintSaleContract, MintSaleTransaction], 'sync_chain'),
        forwardRef(() => MintSaleContractModule),
        forwardRef(() => MintSaleTransactionModule),
    ],
    exports: [MerkleTreeModule, MerkleTreeResolver],
    providers: [MerkleTreeResolver, MerkleTreeService],
})
export class MerkleTreeModule {}
