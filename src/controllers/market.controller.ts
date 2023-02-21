import { Controller, Get, Param, Query, Req } from '@nestjs/common';
import { Request } from 'express';
import { Public } from '../lib/decorators/public.decorator.js';
import { VActivityReqDto, VActivityRspDto, VAddressHoldingReqDto, VAddressHoldingRspDto, VAddressReleasedReqDto, VCollectionActivityReqDto, VCollectionActivityRspDto, VGlobalSearchReqDto, VGlobalSearchRspDto } from '../dto/market.dto.js';
import { IResponse, ResponseInternalError, ResponseSucc } from '../lib/interfaces/response.interface.js';
import { MarketService } from '../services/market.service.js';
import { ApiResponse, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { JWTService } from '../services/jwt.service.js';

@ApiTags('Market')
@ApiSecurity('session') // swagger authentication, in header.session
@Controller({
    path: 'market',
    version: '1',
})
export class MarketController {
    constructor(private readonly marketService: MarketService, private readonly jwtService: JWTService) {}

    @Public()
    @ApiResponse({
        type: VAddressHoldingRspDto,
    })
    @Get('/get_address_holdings')
    public async getAddressHoldings(@Req() req: Request, @Query() args: VAddressHoldingReqDto): Promise<IResponse> {
        try {
            const payload = await this.jwtService.verifySession(req.headers.session);
            const rsp = await this.marketService.getAddressHoldings(args, payload);
            return new ResponseSucc(rsp);
        } catch (err) {
            return new ResponseInternalError((err as Error).message);
        }
    }

    @Public()
    @ApiResponse({ type: VActivityRspDto })
    @Get('/get_address_activities')
    public async getAddressActivities(@Req() req: Request, @Query() args: VActivityReqDto): Promise<IResponse> {
        try {
            const payload = await this.jwtService.verifySession(req.headers.session);
            const rsp = await this.marketService.getAddressActivities(args, payload);
            return new ResponseSucc(rsp);
        } catch (err) {
            return new ResponseInternalError((err as Error).message);
        }
    }

    @Public()
    @ApiResponse({
        type: VAddressReleasedReqDto,
    })
    @Get('/get_address_released')
    public async getAddressReleased(@Req() req: Request, @Query() args: VAddressReleasedReqDto): Promise<IResponse> {
        try {
            const payload = await this.jwtService.verifySession(req.headers.session);
            const rsp = await this.marketService.getAddressReleased(args, payload);
            return new ResponseSucc(rsp);
        } catch (err) {
            return new ResponseInternalError((err as Error).message);
        }
    }

    @Public()
    @ApiResponse({ type: VCollectionActivityRspDto })
    @Get('/get_collection_activities')
    public async getCollectionActivities(@Req() req: Request, @Query() args: VCollectionActivityReqDto): Promise<IResponse> {
        try {
            const payload = await this.jwtService.verifySession(req.headers.session);
            const rsp = await this.marketService.getCollectionActivities(args, payload);
            return new ResponseSucc(rsp);
        } catch (err) {
            return new ResponseInternalError((err as Error).message);
        }
    }

    @Public()
    @ApiResponse({ type: VGlobalSearchRspDto })
    @Get('/search')
    public async search(@Req() req: Request, @Query() args: VGlobalSearchReqDto): Promise<IResponse> {
        try {
            const payload = await this.jwtService.verifySession(req.headers.session);
            const rsp = await this.marketService.executeSearch(args, payload);
            return new ResponseSucc(rsp);
        } catch (err) {
            return new ResponseInternalError((err as Error).message);
        }
    }
}
