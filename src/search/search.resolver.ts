import { Args, Context, Query, Resolver } from '@nestjs/graphql';
import { Public } from '../lib/decorators/public.decorator';

import { SearchService } from './search.service';
import { VGlobalSearchReqDto, VGlobalSearchRspDto } from './search.dto';

@Resolver('Search')
export class SearchResolver {
    constructor(private readonly searchService: SearchService) {}

    @Public()
    @Query(() => VGlobalSearchRspDto)
    public async globalSearch(@Args() args: VGlobalSearchReqDto): Promise<VGlobalSearchRspDto> {
        const rsp = await this.searchService.executeGlobalSearch(args);
        return rsp;
    }

    @Public()
    @Query(() => VGlobalSearchRspDto)
    public async globalSearchV1(@Args() args: VGlobalSearchReqDto): Promise<VGlobalSearchRspDto> {
        const rsp = await this.searchService.executeGlobalSearchV1(args);
        return rsp;
    }
}
