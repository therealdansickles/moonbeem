import { Public } from '../lib/decorators/public.decorator.js';
import { Args, Context, Query, Resolver } from '@nestjs/graphql';
import { LandingPageCollectionReqDto, LandingPageCollectionRspDto, LandingPageRankingOfCreatorsReqDto, LandingPageRankingOfCreatorsRspDto, LandingPageRankingOfItemsReqDto, LandingPageRankingOfItemsRspDto } from '../dto/landing.dto.js';
import { LandingService } from '../services/landing.service.js';

@Resolver('Landing')
export class LandingResolver {
    constructor(private readonly landingService: LandingService) {}

    @Public()
    @Query(() => LandingPageCollectionRspDto)
    async getLandingPageCollections(@Context('req') req: any, @Args() args: LandingPageCollectionReqDto): Promise<LandingPageCollectionRspDto> {
        const rsp = await this.landingService.getLandingPageCollections(args);
        return rsp;
    }

    @Public()
    @Query(() => LandingPageRankingOfCreatorsRspDto)
    async getRankingOfCreators(@Context('req') req: any, @Args() args: LandingPageRankingOfCreatorsReqDto): Promise<LandingPageRankingOfCreatorsRspDto> {
        const rsp = await this.landingService.getRankingOfCreators(args);
        return rsp;
    }

    @Public()
    @Query(() => LandingPageRankingOfItemsRspDto)
    async getRankingOfItems(@Context('req') req: any, @Args() args: LandingPageRankingOfItemsReqDto): Promise<LandingPageRankingOfItemsRspDto> {
        const rsp = await this.landingService.getRankingOfItems(args);
        return rsp;
    }
}
