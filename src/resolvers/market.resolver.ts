import { Args, Context, Query, Resolver } from '@nestjs/graphql';
import { VActivityReqDto, VActivityRspDto, VAddressHoldingReqDto, VAddressHoldingRspDto, VAddressReleasedReqDto, VAddressReleasedRspDto, VCollectionActivityReqDto, VCollectionActivityRspDto } from '../dto/market.dto.js';
import { Public } from '../lib/decorators/public.decorator.js';
import { JWTService } from '../services/jwt.service.js';
import { MarketService } from '../services/market.service.js';

@Resolver('Market')
export class MarketResolver {
    constructor(private readonly marketService: MarketService, private readonly jwtService: JWTService) {}

    @Public()
    @Query(() => VAddressHoldingRspDto)
    async getAddressHoldings(@Context('req') req: any, @Args() args: VAddressHoldingReqDto): Promise<VAddressHoldingRspDto> {
        const payload = await this.jwtService.verifySession(req.headers.session);
        const rsp = await this.marketService.getAddressHoldings(args, payload);
        return rsp;
    }

    @Public()
    @Query(() => VActivityRspDto)
    public async getAddressActivities(@Context('req') req: any, @Args() args: VActivityReqDto): Promise<VActivityRspDto> {
        const payload = await this.jwtService.verifySession(req.headers.session);
        const rsp = await this.marketService.getAddressActivities(args, payload);
        return rsp;
    }

    @Public()
    @Query(() => VAddressReleasedRspDto)
    async getAddressReleased(@Context('req') req: any, @Args() args: VAddressReleasedReqDto): Promise<VAddressReleasedRspDto> {
        const payload = await this.jwtService.verifySession(req.headers.session);
        const rsp = await this.marketService.getAddressReleased(args, payload);
        return rsp;
    }

    @Public()
    @Query(() => VCollectionActivityRspDto)
    public async getCollectionActivities(@Context('req') req: any, @Args() args: VCollectionActivityReqDto): Promise<VCollectionActivityRspDto> {
        const payload = await this.jwtService.verifySession(req.headers.session);
        const rsp = await this.marketService.getCollectionActivities(args, payload);
        return rsp;
    }
}
