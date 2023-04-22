import { Controller, Get, Query, Req } from '@nestjs/common';
import { Request } from 'express';
import { ApiResponse, ApiSecurity, ApiTags } from '@nestjs/swagger';
import {
    VAddressHoldingRspDto,
    VAddressHoldingReqDto,
    MarketAddressActivitiesRspDto,
    MarketAddressReleasedRspDto,
    MarketAddressActivitiesReqDto,
    MarketAddressReleasedReqDto,
    VCollectionActivityRspDto,
    VCollectionActivityReqDto,
} from '../dto/market.dto';
import { Public } from '../lib/decorators/public.decorator';
import { IResponse, ResponseSucc, ResponseInternalError } from '../lib/interfaces/response.interface';
import { JWTService } from '../services/jwt.service';
import { MarketService } from '../services/market.service';

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
            const rsp = await this.marketService.getAddressHoldings(args);
            return new ResponseSucc(rsp);
        } catch (err) {
            return new ResponseInternalError((err as Error).message);
        }
    }

    @Public()
    @ApiResponse({ type: MarketAddressActivitiesRspDto })
    @Get('/get_address_activities')
    public async getAddressActivities(
        @Req() req: Request,
        @Query() args: MarketAddressActivitiesReqDto
    ): Promise<IResponse> {
        try {
            const rsp = await this.marketService.getAddressActivities(args);
            return new ResponseSucc(rsp);
        } catch (err) {
            return new ResponseInternalError((err as Error).message);
        }
    }

    @Public()
    @ApiResponse({
        type: MarketAddressReleasedRspDto,
    })
    @Get('/get_address_released')
    public async getAddressReleased(
        @Req() req: Request,
        @Query() args: MarketAddressReleasedReqDto
    ): Promise<IResponse> {
        try {
            const rsp = await this.marketService.getAddressReleased(args);
            return new ResponseSucc(rsp);
        } catch (err) {
            return new ResponseInternalError((err as Error).message);
        }
    }

    @Public()
    @ApiResponse({ type: VCollectionActivityRspDto })
    @Get('/get_collection_activities')
    public async getCollectionActivities(
        @Req() req: Request,
        @Query() args: VCollectionActivityReqDto
    ): Promise<IResponse> {
        try {
            const rsp = await this.marketService.getCollectionActivities(args);
            return new ResponseSucc(rsp);
        } catch (err) {
            return new ResponseInternalError((err as Error).message);
        }
    }
}
