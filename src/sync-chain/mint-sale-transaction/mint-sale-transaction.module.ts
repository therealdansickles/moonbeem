import { Module } from '@nestjs/common';
import { MintSaleTransaction } from './mint-sale-transaction.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MintSaleTransactionService } from './mint-sale-transaction.service';
import { MintSaleTransactionResolver } from './mint-sale-transaction.resolver';
import { SharedModule } from '../../modules/share.module';

@Module({
    imports: [SharedModule, TypeOrmModule.forFeature([MintSaleTransaction], 'sync_chain')],
    exports: [MintSaleTransactionModule, SharedModule],
    providers: [MintSaleTransactionService, MintSaleTransactionResolver],
})
export class MintSaleTransactionModule {}
