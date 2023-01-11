import { Module } from '@nestjs/common';
import { AuthController } from 'src/controllers/auth.controller';
import { AuthService } from 'src/services/auth.service';
import { UserWalletModule } from './user.wallet.module';
import { PassportModule } from '@nestjs/passport';
import { JWTModule } from './jwt.module';
import { SharedModule } from './share.module';
import { AuthResolver } from 'src/resolvers/auth.resolver';

@Module({
    imports: [SharedModule, UserWalletModule, PassportModule, JWTModule],
    providers: [AuthService, AuthResolver],
    controllers: [AuthController],
    exports: [],
})
export class AuthModule {}
