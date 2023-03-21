import { Module } from '@nestjs/common';
import { AuthController } from '../controllers/auth.controller';
import { AuthService } from '../services/auth.service';
import { UserWalletModule } from './user.wallet.module';
import { PassportModule } from '@nestjs/passport';
import { JWTModule } from './jwt.module';
import { SharedModule } from './share.module';
import { AuthResolver } from '../resolvers/auth.resolver';

@Module({
    imports: [SharedModule, UserWalletModule, PassportModule, JWTModule],
    providers: [AuthService, AuthResolver],
    controllers: [AuthController],
    exports: [],
})
export class AuthModule {}
