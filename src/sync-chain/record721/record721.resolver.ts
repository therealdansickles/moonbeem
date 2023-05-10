import { Args, Query, Resolver } from '@nestjs/graphql';
import { Public } from '../../lib/decorators/public.decorator';
import { Record721Service } from './record721.service';
import { Record721 } from './record721.dto';

@Resolver('Record721')
export class Record721Resolver {
    constructor(private readonly record721Service: Record721Service) {}

    @Public()
    @Query(() => Record721, { description: 'returns erc721 contract for a given uuid' })
    async record721(@Args('id') id: string): Promise<Record721> {
        return await this.record721Service.getRecord721(id);
    }
}
