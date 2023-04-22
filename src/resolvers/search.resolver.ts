import { Args, Context, Query, Resolver } from '@nestjs/graphql';
import { Public } from '../lib/decorators/public.decorator';

import { SearchService } from '../services/search.service';
import { VGlobalSearchReqDto, VGlobalSearchRspDto } from '../dto/search.dto';

@Resolver('Search')
export class SearchResolver {
    constructor(private readonly searchService: SearchService) {}

    @Public()
    @Query(() => VGlobalSearchRspDto)
    public async globalSearch(
        @Context('req') req: any,
        @Args() args: VGlobalSearchReqDto
    ): Promise<VGlobalSearchRspDto> {
        const rsp = await this.searchService.executeGlobalSearch(args);
        return rsp;
    }
}
