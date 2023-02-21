import { Module } from '@nestjs/common';
import { AuthController } from '../controllers/auth.controller.js';
import { AuthService } from '../services/auth.service.js';
import { UserWalletModule } from './user.wallet.module.js';
import { PassportModule } from '@nestjs/passport';
import { JWTModule } from './jwt.module.js';
import { SharedModule } from './share.module.js';
import { AuthResolver } from '../resolvers/auth.resolver.js';

@Module({
    imports: [SharedModule, UserWalletModule, PassportModule, JWTModule],
    providers: [AuthService, AuthResolver],
    controllers: [AuthController],
    exports: [],
})
export class AuthModule {}
