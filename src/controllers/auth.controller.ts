import { Controller, Req, Post, HttpCode, HttpStatus, Body } from '@nestjs/common';
import { IResponse, ResponseInternalError, ResponseSucc } from 'src/lib/interfaces/response.interface';
import { LoginReqDto } from 'src/lib/interfaces/auth.interface';
import { Public } from 'src/lib/decorators/public.decorator';
import { AuthPayload, AuthService } from 'src/services/auth.service';
import { UserWalletService } from 'src/services/user.wallet.service';
import { Request } from 'express';

@Controller({
    path: 'auth',
    version: '1',
})
export class AuthController {
    constructor(private readonly authService: AuthService, private userWalletService: UserWalletService) {}

    @Post('login')
    @Public()
    @HttpCode(HttpStatus.OK)
    public async login(@Body() login: LoginReqDto): Promise<IResponse> {
        try {
            var rsp = await this.authService.validateLoginWithWallet(login.address, login.message, login.signature);
            return new ResponseSucc(rsp);
        } catch (error) {
            return new ResponseInternalError((error as Error).message);
        }
    }

    @Post('logout')
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
