import { Module } from '@nestjs/common';
import { UserWalletController } from 'src/controllers/user.wallet.controller';
import { UserWalletService } from '../services/user.wallet.service';
import { JWTModule } from './jwt.module';
import { SharedModule } from './share.module';

@Module({
    imports: [JWTModule, SharedModule],
    providers: [UserWalletService],
    controllers: [UserWalletController],
    exports: [UserWalletService],
})
export class UserWalletModule {}
