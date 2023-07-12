import { Resolver, Query, Args } from '@nestjs/graphql';
import { Public } from '../session/session.decorator';
import { MoonpayUrl } from './moonpay.dto';
import { MoonpayService } from './moonpay.service';

@Resolver()
export class MoonpayResolver {
    constructor(private readonly moonpay: MoonpayService) {}

    @Public()
    @Query(() => MoonpayUrl)
    public getMoonpaySignature(
        @Args('currency') currency: string,
        @Args('address') address: string,
        @Args('theme') theme: string,
        @Args('signature') signature: string,
        @Args('message') message: string
    ): MoonpayUrl {
        return this.moonpay.generateMoonpayUrlWithSignature({ currency, address, theme, signature, message });
    }
}
