import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { jwtConfig } from './configs/jwt.config';
import { AuthPayload } from 'src/services/auth.service';
import { JWTService } from 'src/services/jwt.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor(private jwtService: JWTService) {
        super({
            jwtFromRequest: ExtractJwt.fromHeader('session'),
            ignoreExpiration: false,
            secretOrKey: jwtConfig.secretKey,
        });
    }

    async validate(payload: AuthPayload) {
        const ret = await this.jwtService.validateIsLogin(payload.address);
        if (!ret) throw new UnauthorizedException();

        return {
            address: payload.address,
            signature: payload.signature,
        };
    }
}
