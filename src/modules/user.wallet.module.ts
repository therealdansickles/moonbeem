import { Module } from '@nestjs/common';
import { UserWalletController } from '../controllers/user.wallet.controller.js';
import { UserWalletResolver } from '../resolvers/user.wallet.resolver.js';
import { UserWalletService } from '../services/user.wallet.service.js';
import { JWTModule } from './jwt.module.js';
import { SharedModule } from './share.module.js';

@Module({
    imports: [JWTModule, SharedModule],
    providers: [UserWalletService, UserWalletResolver],
    controllers: [UserWalletController],
    exports: [UserWalletService],
})
export class UserWalletModule {}
