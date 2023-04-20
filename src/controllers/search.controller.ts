import { Body, Controller, Get, Post, Query, Req } from '@nestjs/common';
import { ApiResponse, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { Public } from '../lib/decorators/public.decorator';
import { IResponse, ResponseSucc, ResponseInternalError } from '../lib/interfaces/response.interface';
import { VGlobalSearchReqDto, VGlobalSearchRspDto } from '../dto/search.dto';
import { SearchService } from '../services/search.service';

@ApiTags('Search')
@Controller({
    path: 'search',
    version: '1',
})
export class SearchController {
    constructor(private readonly searchService: SearchService) {}

    @Public()
    @ApiResponse({
        status: 200,
        description: 'global search endpoint',
        type: VGlobalSearchRspDto,
    })
    @Get('/global')
    public async search(@Req() req: Request, @Query() args: VGlobalSearchReqDto): Promise<IResponse> {
        try {
            const rsp = await this.searchService.executeGlobalSearch(args);
            return new ResponseSucc(rsp);
        } catch (err) {
            return new ResponseInternalError((err as Error).message);
        }
    }
}
