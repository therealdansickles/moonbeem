import { Args, Query, Resolver, ResolveField } from '@nestjs/graphql';
import { Public } from '../session/session.decorator';
import { SearchService } from './search.service';
import { Search, SearchInput } from './search.dto';
import { SearchUser } from '../user/user.dto';
import { SearchWallet } from '../wallet/wallet.dto';
import { SearchCollection } from '../collection/collection.dto';

@Resolver(() => Search)
export class SearchResolver {
    constructor(private readonly searchService: SearchService) {}

    @Public()
    @Query(() => Search, { nullable: true })
    public async search(): Promise<Search> {
        return {};
    }

    @Public()
    @ResolveField(() => SearchUser, {
        description: 'Retrieves the minted NFTs for the given wallet.',
        nullable: true,
    })
    async user(@Args('input') input: SearchInput): Promise<SearchUser> {
        return this.searchService.searchFromUser(input);
    }

    @Public()
    @ResolveField(() => SearchWallet, {
        description: 'Retrieves the minted NFTs for the given wallet.',
        nullable: true,
    })
    async wallet(@Args('input') input: SearchInput): Promise<SearchWallet> {
        return this.searchService.searchFromWallet(input);
    }

    @Public()
    @ResolveField(() => SearchCollection, {
        description: 'Retrieves the minted NFTs for the given wallet.',
        nullable: true,
    })
    async collection(@Args('input') input: SearchInput): Promise<SearchCollection> {
        return this.searchService.searchFromCollection(input);
    }
}
