import { Controller, Req, Post, Body } from '@nestjs/common';
import { Request } from 'express';
import { ApiResponse, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { AuthPayload, AuthService } from './auth.service';
import {
    CreateUserWithEmailInput,
    LoginWithEmailInput,
    LoginWithEmailResponse,
    LoginWithWalletInput,
    LoginWithWalletResponse,
    LogoutInput,
} from './auth.dto';
import { IResponse, ResponseInternalError, ResponseSucc } from '../lib/interfaces/response.interface';
import { Public } from '../lib/decorators/public.decorator';

@ApiTags('Auth') // swagger tag category
@Controller({
    path: 'auth',
    version: '1',
})
export class AuthController {
    constructor(private readonly authService: AuthService) {}

    @Public() // decorator: this api is public, no identity verification required
    @ApiResponse({
        status: 200,
        description: 'login with wallet',
        type: LoginWithWalletResponse,
    })
    @Post('loginWithWallet')
    public async loginWithWallet(@Body() login: LoginWithWalletInput): Promise<IResponse> {
        try {
            const rsp = await this.authService.loginWithWallet(
                login.address.toLowerCase(),
                login.message,
                login.signature
            );
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
    public async logout(@Body() data: LogoutInput): Promise<IResponse> {
        try {
            const identifier = data.address ?? data.email;
            const rsp = await this.authService.logout(identifier);
            return new ResponseSucc(rsp);
        } catch (err) {
            return new ResponseInternalError((err as Error).message);
        }
    }

    @Public() // decorator: this api is public, no identity verification required
    @ApiResponse({
        status: 201,
        description: 'signup with email',
        type: LoginWithEmailResponse,
    })
    @Post('createUserWithEmail')
    public async createUserWithEmail(@Body() data: CreateUserWithEmailInput): Promise<IResponse> {
        try {
            const rsp = await this.authService.createUserWithEmail(data);
            return new ResponseSucc(rsp);
        } catch (error) {
            return new ResponseInternalError((error as Error).message);
        }
    }

    @Public() // decorator: this api is public, no identity verification required
    @ApiResponse({
        status: 200,
        description: 'login with email',
        type: LoginWithEmailResponse,
    })
    @Post('loginWithEmail')
    public async loginWithEmail(@Body() data: LoginWithEmailInput): Promise<IResponse> {
        try {
            const rsp = await this.authService.loginWithEmail(data);
            return new ResponseSucc(rsp);
        } catch (error) {
            return new ResponseInternalError((error as Error).message);
        }
    }
}
