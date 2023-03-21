import { Args, Context, Query, Resolver } from '@nestjs/graphql';
import { LandingPageCollectionRspDto, LandingPageCollectionReqDto, LandingPageRankingOfCreatorsRspDto, LandingPageRankingOfCreatorsReqDto, LandingPageRankingOfItemsRspDto, LandingPageRankingOfItemsReqDto } from '../dto/landing.dto';
import { Public } from '../lib/decorators/public.decorator';
import { LandingService } from '../services/landing.service';

@Resolver('Landing')
export class LandingResolver {
    constructor(private readonly landingService: LandingService) {}

    @Public()
    @Query(() => LandingPageCollectionRspDto)
    async getLandingPageCollections(@Context('req') req: unknown, @Args() args: LandingPageCollectionReqDto): Promise<LandingPageCollectionRspDto> {
        const rsp = await this.landingService.getLandingPageCollections(args);
        return rsp;
    }

    @Public()
    @Query(() => LandingPageRankingOfCreatorsRspDto)
    async getRankingOfCreators(@Context('req') req: unknown, @Args() args: LandingPageRankingOfCreatorsReqDto): Promise<LandingPageRankingOfCreatorsRspDto> {
        const rsp = await this.landingService.getRankingOfCreators(args);
        return rsp;
    }

    @Public()
    @Query(() => LandingPageRankingOfItemsRspDto)
    async getRankingOfItems(@Context('req') req: unknown, @Args() args: LandingPageRankingOfItemsReqDto): Promise<LandingPageRankingOfItemsRspDto> {
        const rsp = await this.landingService.getRankingOfItems(args);
        return rsp;
    }
}
