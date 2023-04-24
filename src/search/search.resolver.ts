import { Args, Context, Query, Resolver } from '@nestjs/graphql';
import { Public } from '../lib/decorators/public.decorator';

import { SearchService } from './search.service';
import { GlobalSearchResult, GloablSearchInput } from './search.dto';

@Resolver('Search')
export class SearchResolver {
    constructor(private readonly searchService: SearchService) {}

    @Public()
    @Query(() => GlobalSearchResult)
    public async globalSearch(@Args('input') input: GloablSearchInput): Promise<GlobalSearchResult> {
        const rsp = await this.searchService.executeGlobalSearch(input);
        return rsp;
    }

    @Public()
    @Query(() => GlobalSearchResult)
    public async globalSearchV1(@Args('input') input: GloablSearchInput): Promise<GlobalSearchResult> {
        const rsp = await this.searchService.executeGlobalSearchV1(input);
        return rsp;
    }
}
