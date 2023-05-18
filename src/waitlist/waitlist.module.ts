import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Waitlist } from './waitlist.entity';
import { WaitlistService } from './waitlist.service';
import { WaitlistResolver } from './waitlist.resolver';
import { MintSaleTransaction } from '../sync-chain/mint-sale-transaction/mint-sale-transaction.entity';
import { MintSaleTransactionModule } from '../sync-chain/mint-sale-transaction/mint-sale-transaction.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([Waitlist]),
        TypeOrmModule.forFeature([MintSaleTransaction], 'sync_chain'),
        forwardRef(() => MintSaleTransactionModule),
    ],
    exports: [WaitlistModule],
    providers: [WaitlistService, WaitlistResolver],
})
export class WaitlistModule {}
