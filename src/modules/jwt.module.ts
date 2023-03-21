import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { SharedModule } from './share.module';
import { JWTService } from '../services/jwt.service';
import { jwtConfig } from '../lib/configs/jwt.config';
import { LocalStrategy } from '../lib/strategies/local.strategy';
import { JwtStrategy } from '../lib/strategies/jwt.strategy';
import { APP_GUARD } from '@nestjs/core';
import { JwtAuthGuard } from '../lib/guards/jwt-auth.guard';

@Module({
    imports: [
        SharedModule,
        JwtModule.register({
            secret: jwtConfig.secretKey,
            signOptions: { expiresIn: `${jwtConfig.maxAge}s` },
        }),
    ],
    providers: [
        JWTService,
        LocalStrategy,
        JwtStrategy,
        {
            provide: APP_GUARD,
            useClass: JwtAuthGuard,
        },
    ],
    controllers: [],
    exports: [JWTService],
})
export class JWTModule {}
