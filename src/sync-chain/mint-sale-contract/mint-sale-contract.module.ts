import { Module, forwardRef } from '@nestjs/common';
import { MintSaleContract } from './mint-sale-contract.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MintSaleContractService } from './mint-sale-contract.service';
import { MintSaleContractResolver } from './mint-sale-contract.resolver';
import { SharedModule } from '../../modules/share.module';
import { Factory } from '../factory/factory.entity';
import { FactoryModule } from '../factory/factory.module';
import { MintSaleTransactionModule } from '../mint-sale-transaction/mint-sale-transaction.module';
import { MintSaleTransaction } from '../mint-sale-transaction/mint-sale-transaction.entity';

@Module({
    imports: [
        TypeOrmModule.forFeature([MintSaleContract, MintSaleTransaction, Factory], 'sync_chain'),
        SharedModule,
        MintSaleTransactionModule,
        forwardRef(() => FactoryModule),
        forwardRef(() => MintSaleTransactionModule),
    ],
    exports: [MintSaleContractModule, MintSaleContractService],
    providers: [MintSaleContractService, MintSaleContractResolver],
})
export class MintSaleContractModule {}
