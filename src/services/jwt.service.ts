import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { RedisAdapter } from '../lib/adapters/redis.adapter';
import { jwtConfig } from '../lib/configs/jwt.config';

interface AuthPayload {
    id?: string;
    address?: string;
    signature?: string;
    email?: string;
}

const SESSION_PREFIX = 'login_session:';

@Injectable()
export class JWTService {
    constructor(private jwt: JwtService, private readonly redisClient: RedisAdapter) {}

    /**
     * Token is obtained through jwt signature. Payload has wallet id, address and signature
     * @param payload AuthPayload containing id and either address + signature or email
     * @returns session
     */
    createToken(payload: AuthPayload): string {
        const token = this.jwt.sign(payload);
        return token;
    }

    parseToken(token: string | string[]) {
        try {
            const _token = typeof token == 'string' ? token : token[0];
            const res = this.jwt.verify<AuthPayload>(_token, { secret: jwtConfig.secretKey });
            return res;
        } catch (err) {
            throw new Error('Unknown Token');
        }
    }

    /**
     * Check if the session is correct. Generally used in public, but also can carry session api
     * @param token User signature token, come from Request.headers.session
     * @returns if parse is successed, return user authorization basic information. if not, return undefined
     */
    async verifySession(token: string | string[]): Promise<AuthPayload> {
        // parse token is correct
        if (!token) return;

        const payload = this.parseToken(token);
        if (!payload) return;

        // check token has been delete
        const isLogin = await this.validateIsLogin(payload.address?.toLowerCase() ?? payload.email?.toLowerCase());

        if (!isLogin) return;
        return payload;
    }

    /**
     * Check whether the address is login and whether the session exists in Redis
     * @param address which address you want to verify
     * @returns boolean
     */
    async validateIsLogin(identifier: string): Promise<boolean> {
        const _key = this.redisClient.getKey(identifier.toLocaleLowerCase(), SESSION_PREFIX);
        const val = await this.redisClient.get(_key);
        if (!val) return false;
        return true;
    }
}
