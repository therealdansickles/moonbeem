import { Args, Resolver, Query } from '@nestjs/graphql';
import { Public } from '../../session/session.decorator';
import { Asset721Service } from './asset721.service';
import { Asset721 } from './asset721.dto';

@Resolver('Asset721')
export class Asset721Resolver {
    constructor(private readonly asset721Service: Asset721Service) {}

    @Public()
    @Query(() => Asset721, { description: 'returns a asset for a given uuid' })
    async asset721(@Args('id') id: string): Promise<Asset721> {
        return await this.asset721Service.getAsset721(id);
    }
}
