import { Args, Int, Query, Resolver } from '@nestjs/graphql';
import { Public } from '../../session/session.decorator';
import { Coin } from './coin.dto';
import { CoinService } from './coin.service';

@Resolver('Coin')
export class CoinResolver {
    constructor(private readonly coinService: CoinService) {}

    @Public()
    @Query(() => Coin, { description: 'returns coin for a given uuid' })
    async coin(@Args('id') id: string): Promise<Coin> {
        return await this.coinService.getCoin(id);
    }

    @Public()
    @Query(() => [Coin], { description: 'returns coin list for a given chainId' })
    async coins(
        @Args('chainId', { type: () => Int, nullable: true }) chainId?: number,
            @Args('enable', { type: () => Boolean, nullable: true }) enable?: boolean
    ): Promise<Coin[]> {
        const data = { chainId, enable };
        return await this.coinService.getCoins(data);
    }
}
