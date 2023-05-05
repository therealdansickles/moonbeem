import { Module, forwardRef } from '@nestjs/common';
import { MintSaleContract } from './mint-sale-contract.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MintSaleContractService } from './mint-sale-contract.service';
import { MintSaleContractResolver } from './mint-sale-contract.resolver';
import { SharedModule } from '../../modules/share.module';
import { Factory } from '../factory/factory.entity';
import { FactoryModule } from '../factory/factory.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([MintSaleContract, Factory], 'sync_chain'),
        SharedModule,
        forwardRef(() => FactoryModule),
    ],
    exports: [MintSaleContractModule, MintSaleContractService],
    providers: [MintSaleContractService, MintSaleContractResolver],
})
export class MintSaleContractModule {}
