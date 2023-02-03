import { Args, Context, Query, Resolver } from '@nestjs/graphql';
import { VActivityReqDto, VActivityRspDto, VAddressHoldingReqDto, VAddressHoldingRspDto, VAddressReleasedReqDto, VAddressReleasedRspDto, VCollectionActivityReqDto, VCollectionActivityRspDto } from 'src/dto/market.dto';
import { VUserWallet } from 'src/dto/user.wallet.dto';
import { Public } from 'src/lib/decorators/public.decorator';
import { JWTService } from 'src/services/jwt.service';
import { MarketService } from 'src/services/market.service';

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
