import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { jwtConfig } from '../configs/jwt.config';
import { JWTService } from '../../services/jwt.service';
import { AuthPayload } from '../../auth/auth.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor(private jwtService: JWTService) {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken,
            ignoreExpiration: false,
            secretOrKey: jwtConfig.secretKey,
        });
    }

    async validate(payload: AuthPayload) {
        const ret = await this.jwtService.validateIsLogin(payload.address?.toLowerCase() ?? payload.email?.toLowerCase());
        if (!ret) throw new UnauthorizedException();

        return {
            id: payload.id,
            address: payload.address,
            signature: payload.signature,
            email: payload.email,
        };
    }
}
