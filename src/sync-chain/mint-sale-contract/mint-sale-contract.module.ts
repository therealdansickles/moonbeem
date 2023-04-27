import { Module } from '@nestjs/common';
import { MintSaleContract } from './mint-sale-contract.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MintSaleContractService } from './mint-sale-contract.service';
import { MintSaleContractResolver } from './mint-sale-contract.resolver';

@Module({
    imports: [TypeOrmModule.forFeature([MintSaleContract], 'sync_chain')],
    exports: [MintSaleContractModule],
    providers: [MintSaleContractService, MintSaleContractResolver],
})
export class MintSaleContractModule {}
