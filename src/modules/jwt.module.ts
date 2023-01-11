import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { SharedModule } from './share.module';
import { JWTService } from 'src/services/jwt.service';
import { jwtConfig } from 'src/lib/configs/jwt.config';
import { LocalStrategy } from 'src/lib/strategies/local.strategy';
import { JwtStrategy } from 'src/lib/strategies/jwt.strategy';
import { APP_GUARD } from '@nestjs/core';
import { JwtAuthGuard } from 'src/lib/guards/jwt-auth.guard';

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
