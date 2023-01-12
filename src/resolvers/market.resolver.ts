import { Args, Context, Query, Resolver } from '@nestjs/graphql';
import { VAddressHoldingReqDto } from 'src/dto/market.dto';
import { VUserWallet } from 'src/dto/user.wallet.dto';
import { Public } from 'src/lib/decorators/public.decorator';
import { JWTService } from 'src/services/jwt.service';
import { MarketService } from 'src/services/market.service';

@Resolver('Market')
export class MarketResolver {
    constructor(private readonly marketService: MarketService, private readonly jwtService: JWTService) {}

    @Public()
    @Query(() => VUserWallet)
    async getAddressHoldings(@Context('req') req: any, @Args() args: VAddressHoldingReqDto): Promise<VUserWallet> {
        const payload = await this.jwtService.verifySession(req.headers.session);
        console.log("payload: ", payload)
        const rsp = await this.marketService.getAddressHoldings(args.address.toLowerCase(), payload);
        return rsp;
    }
}
