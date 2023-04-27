import { Args, Resolver, Query } from '@nestjs/graphql';
import { Public } from '../../lib/decorators/public.decorator';
import { History721 } from './history721.dto';
import { History721Service } from './history721.service';

@Resolver('History721')
export class History721Resolver {
    constructor(private readonly history721Service: History721Service) {}

    @Public()
    @Query(() => History721, { description: 'returns a asset for a given uuid' })
    async history721(@Args('id') id: string): Promise<History721> {
        return await this.history721Service.getHistory721(id);
    }
}
