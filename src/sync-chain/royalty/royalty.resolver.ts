import { Args, Resolver, Query } from '@nestjs/graphql';
import { Public } from '../../lib/decorators/public.decorator';
import { RoyaltyService } from './royalty.service';
import { Royalty } from './royalty.dto';

@Resolver('Royalty')
export class RoyaltyResolver {
    constructor(private readonly royaltyService: RoyaltyService) {}

    @Public()
    @Query(() => Royalty)
    async royalty(@Args('id') id: string): Promise<Royalty> {
        return await this.royaltyService.getRoyalty(id);
    }
}
