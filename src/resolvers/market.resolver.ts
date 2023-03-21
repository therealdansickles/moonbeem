import { Args, Context, Query, Resolver } from '@nestjs/graphql';
import { VAddressHoldingRspDto, VAddressHoldingReqDto, VActivityRspDto, VActivityReqDto, VAddressReleasedRspDto, VAddressReleasedReqDto, VCollectionActivityRspDto, VCollectionActivityReqDto } from '../dto/market.dto';
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
    @Query(() => VActivityRspDto)
    public async getAddressActivities(@Context('req') req: any, @Args() args: VActivityReqDto): Promise<VActivityRspDto> {
        const rsp = await this.marketService.getAddressActivities(args);
        return rsp;
    }

    @Public()
    @Query(() => VAddressReleasedRspDto)
    async getAddressReleased(@Context('req') req: any, @Args() args: VAddressReleasedReqDto): Promise<VAddressReleasedRspDto> {
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
