import { Request } from 'express';
import { Controller, Get, Query, Req } from '@nestjs/common';
import { ApiResponse, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { LandingService } from '../services/landing.service';
import { Public } from '../lib/decorators/public.decorator';
import { LandingPageCollectionReqDto, LandingPageCollectionRspDto, LandingPageRankingOfCreatorsReqDto, LandingPageRankingOfCreatorsRspDto, LandingPageRankingOfItemsReqDto, LandingPageRankingOfItemsRspDto } from '../dto/landing.dto';
import { IResponse, ResponseSucc, ResponseInternalError } from '../lib/interfaces/response.interface';

@ApiTags('LandingPage')
@ApiSecurity('session') // swagger authentication, in header.session
@Controller({
    path: 'landing',
    version: '1',
})
export class LandingController {
    constructor(private readonly landingService: LandingService) {}

    @Public()
    @ApiResponse({ type: LandingPageCollectionRspDto })
    @Get('/get_landing_collections')
    public async getLandingPageCollections(@Req() req: Request, @Query() args: LandingPageCollectionReqDto): Promise<IResponse> {
        try {
            const rsp = await this.landingService.getLandingPageCollections(args);
            return new ResponseSucc(rsp);
        } catch (err) {
            return new ResponseInternalError((err as Error).message);
        }
    }

    @Public()
    @ApiResponse({ type: LandingPageRankingOfCreatorsRspDto })
    @Get('/get_ranking_of_creators')
    public async getRankingOfCreators(@Req() req: Request, @Query() args: LandingPageRankingOfCreatorsReqDto): Promise<IResponse> {
        try {
            const rsp = await this.landingService.getRankingOfCreators(args);
            return new ResponseSucc(rsp);
        } catch (err) {
            return new ResponseInternalError((err as Error).message);
        }
    }

    @Public()
    @ApiResponse({ type: LandingPageRankingOfItemsRspDto })
    @Get('/get_ranking_of_items')
    public async getRankingOfItems(@Req() req: Request, @Query() args: LandingPageRankingOfItemsReqDto): Promise<IResponse> {
        try {
            const rsp = await this.landingService.getRankingOfItems(args);
            return new ResponseSucc(rsp);
        } catch (err) {
            return new ResponseInternalError((err as Error).message);
        }
    }
}
