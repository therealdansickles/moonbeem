import { Module } from '@nestjs/common';
import { PostgresAdapter } from 'src/lib/adapters/postgres.adapter';
import { UserWalletService } from '../services/user.wallet.service';

@Module({
    providers: [UserWalletService, PostgresAdapter],
    exports: [UserWalletService],
})
export class UserWalletModule {}
