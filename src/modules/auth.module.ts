import { Module } from '@nestjs/common';
import { AuthController } from 'src/controllers/auth.controller';
import { LocalStrategy } from 'src/lib/strategies/local.strategy';
import { AuthService } from 'src/services/auth.service';
import { UserWalletModule } from './user.wallet.module';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { jwtConfig } from 'src/lib/configs/jwt.config';
import { JwtStrategy } from 'src/lib/strategies/jwt.strategy';
import { JwtAuthGuard } from 'src/lib/jwt-auth.guard';
import { APP_GUARD } from '@nestjs/core';
import { JWTModule } from './jwt.module';
import { SharedModule } from './share.module';

@Module({
    imports: [SharedModule, UserWalletModule, PassportModule, JWTModule],
    providers: [AuthService],
    controllers: [AuthController],
    exports: [],
})
export class AuthModule {}
