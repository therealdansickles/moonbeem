import { Controller, Req, Post, HttpCode, HttpStatus, Body } from '@nestjs/common';
import { IResponse, ResponseInternalError, ResponseSucc } from '../lib/interfaces/response.interface.js';
import { VLoginReqDto, VLoginRspDto } from '../dto/auth.dto.js';
import { Public } from '../lib/decorators/public.decorator.js';
import { AuthPayload, AuthService } from '../services/auth.service.js';
import { UserWalletService } from '../services/user.wallet.service.js';
import { Request } from 'express';
import { ApiResponse, ApiSecurity, ApiTags } from '@nestjs/swagger';

@ApiTags('Auth') // swagger tag category
@Controller({
    path: 'auth',
    version: '1',
})
export class AuthController {
    constructor(private readonly authService: AuthService, private userWalletService: UserWalletService) {}

    @Public() // decorator: this api is public, no identity verification required
    @ApiResponse({
        status: 200,
        description: 'login with wallet',
        type: VLoginRspDto,
    })
    @Post('login')
    public async login(@Body() login: VLoginReqDto): Promise<IResponse> {
        try {
            var rsp = await this.authService.loginWithWallet(login.address.toLowerCase(), login.message, login.signature);
            return new ResponseSucc(rsp);
        } catch (error) {
            return new ResponseInternalError((error as Error).message);
        }
    }

    @ApiResponse({
        status: 200,
        description: 'logout and delete session',
        type: Boolean,
    })
    @Post('logout')
    @ApiSecurity('session') // swagger authentication, in header.session
    public async logout(@Req() req: Request): Promise<IResponse> {
        try {
            const addr = (req.user as AuthPayload).address;
            var rsp = await this.authService.logoutWithWallet(addr);
            return new ResponseSucc(rsp);
        } catch (err) {
            return new ResponseInternalError((err as Error).message);
        }
    }
}
