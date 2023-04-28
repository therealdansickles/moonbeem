import { Module } from '@nestjs/common';
import { MintSaleContract } from './mint-sale-contract.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MintSaleContractService } from './mint-sale-contract.service';
import { MintSaleContractResolver } from './mint-sale-contract.resolver';
import { SharedModule } from '../../modules/share.module';

@Module({
    imports: [TypeOrmModule.forFeature([MintSaleContract], 'sync_chain'), SharedModule],
    exports: [MintSaleContractModule],
    providers: [MintSaleContractService, MintSaleContractResolver],
})
export class MintSaleContractModule {}
