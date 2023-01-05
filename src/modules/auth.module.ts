import { Module } from '@nestjs/common';
import { AuthController } from 'src/controllers/auth.controller';
import { LocalStrategy } from 'src/lib/local.strategy';
import { AuthService } from 'src/services/auth.service';
import { UserWalletModule } from './user.wallet.module';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { jwtConfig } from 'src/lib/configs/jwt.config';
import { JwtStrategy } from 'src/lib/jwt.strategy';
import { JwtAuthGuard } from 'src/lib/jwt-auth.guard';
import { APP_GUARD } from '@nestjs/core';
import { JWTService } from 'src/services/jwt.service';
import { RedisAdapter } from 'src/lib/adapters/redis.adapter';

@Module({
    imports: [
        UserWalletModule,
        PassportModule,
        JwtModule.register({
            secret: jwtConfig.secretKey,
            signOptions: { expiresIn: `${jwtConfig.maxAge}s` },
        }),
    ],
    providers: [
        RedisAdapter,
        AuthService,
        JWTService,
        LocalStrategy,
        JwtStrategy,
        {
            provide: APP_GUARD,
            useClass: JwtAuthGuard,
        },
    ],
    controllers: [AuthController],
})
export class AuthModule {}
