import { Body, Controller, Get, Param, Post, Req } from '@nestjs/common';
import { ApiResponse, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { VUserWalletInfo } from 'src/dto/auth.dto';
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

    @ApiResponse({
        status: 200,
        description: 'follow some users',
        type: Boolean,
    })
    @Post('/follow')
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
    @ApiResponse({
        status: 200,
        description: 'get address info',
        type: VUserWalletInfo,
    })
    @Get(':address')
    public async getAddressInfo(@Req() req: Request, @Param() param: VGetAddressReqDto): Promise<IResponse> {
        try {
            const payload = await this.jwtService.verifySession(req.headers.session);
            const rsp = await this.userWalletService.getAddressInfo(param.address.toLowerCase(), payload);
            return new ResponseSucc(rsp);
        } catch (err) {
            return new ResponseInternalError((err as Error).message);
        }
    }

    @ApiResponse({
        status: 200,
        description: 'update address info',
        type: Boolean,
    })
    @Post('update')
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
