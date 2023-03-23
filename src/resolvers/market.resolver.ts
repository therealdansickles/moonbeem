import { Args, Context, Query, Resolver } from '@nestjs/graphql';
import { VAddressHoldingRspDto, VAddressHoldingReqDto, MarketAddressActivitiesRspDto, MarketAddressActivitiesReqDto, MarketAddressReleasedRspDto, MarketAddressReleasedReqDto, VCollectionActivityRspDto, VCollectionActivityReqDto } from '../dto/market.dto';
import { Public } from '../lib/decorators/public.decorator';
import { JWTService } from '../services/jwt.service';
import { MarketService } from '../services/market.service';

@Resolver('Market')
export class MarketResolver {
    constructor(private readonly marketService: MarketService, private readonly jwtService: JWTService) {}

    @Public()
    @Query(() => VAddressHoldingRspDto)
    async getAddressHoldings(@Context('req') req: any, @Args() args: VAddressHoldingReqDto): Promise<VAddressHoldingRspDto> {
        const rsp = await this.marketService.getAddressHoldings(args);
        return rsp;
    }

    @Public()
    @Query(() => MarketAddressActivitiesRspDto)
    public async getAddressActivities(@Context('req') req: any, @Args() args: MarketAddressActivitiesReqDto): Promise<MarketAddressActivitiesRspDto> {
        const rsp = await this.marketService.getAddressActivities(args);
        return rsp;
    }

    @Public()
    @Query(() => MarketAddressReleasedRspDto)
    async getAddressReleased(@Context('req') req: any, @Args() args: MarketAddressReleasedReqDto): Promise<MarketAddressReleasedRspDto> {
        const rsp = await this.marketService.getAddressReleased(args);
        return rsp;
    }

    @Public()
    @Query(() => VCollectionActivityRspDto)
    public async getCollectionActivities(@Context('req') req: any, @Args() args: VCollectionActivityReqDto): Promise<VCollectionActivityRspDto> {
        const rsp = await this.marketService.getCollectionActivities(args);
        return rsp;
    }
}
