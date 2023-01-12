import { Body, Controller, Get, Param, Post, Req } from '@nestjs/common';
import { ApiResponse, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { VFollowUserWalletReqDto, VGetAddressReqDto, VUpdateUserWalletReqDto } from 'src/dto/user.wallet.dto';
import { Public } from 'src/lib/decorators/public.decorator';
import { IResponse, ResponseInternalError, ResponseSucc } from 'src/lib/interfaces/response.interface';
import { AuthPayload } from 'src/services/auth.service';
import { JWTService } from 'src/services/jwt.service';
import { UserWalletService } from 'src/services/user.wallet.service';

@ApiTags('Wallet')
@ApiSecurity('session') // swagger authentication, in header.session
@Controller({
    path: 'wallet',
    version: '1',
})
export class UserWalletController {
    constructor(private readonly userWalletService: UserWalletService, private readonly jwtService: JWTService) {}

    @Post('/follow')
    @ApiResponse({
        status: 200,
        description: 'follow some users',
        type: Boolean,
    })
    public async followUserWallet(@Req() req: Request, @Body() body: VFollowUserWalletReqDto): Promise<IResponse> {
        try {
            const payload = req.user as AuthPayload;
            const rsp = await this.userWalletService.followUserWallet(payload, body.address.toLowerCase(), body.isFollowed);
            return new ResponseSucc(rsp);
        } catch (err) {
            return new ResponseInternalError((err as Error).message);
        }
    }

    @Public()
    @Get(':address')
    @ApiResponse({
        status: 200,
        description: 'get address info',
    })
    public async getAddressInfo(@Req() req: Request, @Param() param: VGetAddressReqDto): Promise<IResponse> {
        try {
            const payload = await this.jwtService.verifySession(req.headers.session);
            const rsp = await this.userWalletService.getAddressInfo(param.address.toLowerCase(), payload);
            return new ResponseSucc(rsp);
        } catch (err) {
            return new ResponseInternalError((err as Error).message);
        }
    }

    @Post('update')
    @ApiResponse({
        status: 200,
        description: 'update address info',
    })
    public async updateAddresInfo(@Req() req: Request, @Body() body: VUpdateUserWalletReqDto): Promise<IResponse> {
        try {
            const payload = req.user as AuthPayload;
            const rsp = await this.userWalletService.updateAddresInfo(payload.id, body);
            return new ResponseSucc(rsp);
        } catch (err) {
            return new ResponseInternalError((err as Error).message);
        }
    }
}
