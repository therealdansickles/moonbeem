import { Controller, Req, Post, HttpCode, HttpStatus, Body } from '@nestjs/common';
import { IResponse, ResponseInternalError, ResponseSucc } from 'src/lib/interfaces/response.interface';
import { VLoginReqDto, VLoginRspDto } from 'src/dto/auth.dto';
import { Public } from 'src/lib/decorators/public.decorator';
import { AuthPayload, AuthService } from 'src/services/auth.service';
import { UserWalletService } from 'src/services/user.wallet.service';
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
    @Post('login')
    @HttpCode(HttpStatus.OK)
    @ApiResponse({
        status: 200,
        description: 'login with wallet',
        type: VLoginRspDto,
    })
    public async login(@Body() login: VLoginReqDto): Promise<IResponse> {
        try {
            var rsp = await this.authService.loginWithWallet(login.address.toLowerCase(), login.message, login.signature);
            return new ResponseSucc(rsp);
        } catch (error) {
            return new ResponseInternalError((error as Error).message);
        }
    }

    @Post('logout')
    @ApiSecurity('session') // swagger authentication, in header.session
    @ApiResponse({
        status: 200,
        description: 'logout and delete session',
        type: Boolean,
    })
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
