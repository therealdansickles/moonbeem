import { Args, Query, Resolver } from '@nestjs/graphql';
import { Public } from '../../lib/decorators/public.decorator';
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
}
