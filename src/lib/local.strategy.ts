import { Strategy } from 'passport-local';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { AuthService } from '../services/auth.service';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
    constructor(private authService: AuthService) {
        super();
    }

    // async validate(address: string, signature: string): Promise<any> {
    //     console.log(`address: ${address}, pass: ${signature}`);
    //     const user = await this.authService.validateUserWallet(address, '', signature);

    //     if (!user) {
    //         throw new UnauthorizedException();
    //     }
    //     return user;
    // }
}
