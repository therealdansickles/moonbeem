import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { RedisAdapter } from 'src/lib/adapters/redis.adapter';
import { AuthPayload, SESSION_PERFIX } from './auth.service';

@Injectable()
export class JWTService {
    constructor(private jwt: JwtService, private readonly redisClient: RedisAdapter) {}

    createToken(address, signature): string {
        const payload: AuthPayload = {
            address: address,
            signature: signature,
        };

        const token = this.jwt.sign(payload);
        return token;
    }

    async validateIsLogin(address: string): Promise<boolean> {
        const _key = this.redisClient.getKey(address.toLocaleLowerCase(), SESSION_PERFIX);
        const val = await this.redisClient.get(_key);
        if (!val) return false;
        return true;
    }
}
