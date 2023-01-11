import { Module } from '@nestjs/common';
import { UserWalletController } from 'src/controllers/user.wallet.controller';
import { UserWalletResolver } from 'src/resolvers/user.wallet.resolver';
import { UserWalletService } from '../services/user.wallet.service';
import { JWTModule } from './jwt.module';
import { SharedModule } from './share.module';

@Module({
    imports: [JWTModule, SharedModule],
    providers: [UserWalletService, UserWalletResolver],
    controllers: [UserWalletController],
    exports: [UserWalletService],
})
export class UserWalletModule {}
