import { Module } from '@nestjs/common';
import { MintSaleTransaction } from './mint-sale-transaction.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MintSaleTransactionService } from './mint-sale-transaction.service';
import { MintSaleTransactionResolver } from './mint-sale-transaction.resolver';

@Module({
    imports: [TypeOrmModule.forFeature([MintSaleTransaction], 'sync_chain')],
    exports: [MintSaleTransactionModule],
    providers: [MintSaleTransactionService, MintSaleTransactionResolver],
})
export class MintSaleTransactionModule {}
