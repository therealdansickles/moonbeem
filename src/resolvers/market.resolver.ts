import { Args, Context, Query, Resolver } from '@nestjs/graphql';
import { VAddressHoldingReqDto, VAddressHoldingRspDto } from 'src/dto/market.dto';
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
}
