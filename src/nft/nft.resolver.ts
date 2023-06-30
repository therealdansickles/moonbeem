import { isNil, omitBy } from 'lodash';

import { Args, Int, Mutation, Query, Resolver } from '@nestjs/graphql';

import { Public } from '../session/session.decorator';
import { CreateOrUpdateNftInput, Nft } from './nft.dto';
import { INftQuery, NftService } from './nft.service';

@Resolver(() => Nft)
export class NftResolver {
    constructor(
        private readonly nftService: NftService,
    ) {}

    @Public()
    @Query(() => Nft, { description: 'Get a specific NFT by id.', nullable: true })
    async nft(
        @Args({ name: 'id', nullable: true }) id: string,
        @Args({ name: 'collectionId', nullable: true }) collectionId: string,
        @Args({ name: 'tierId', nullable: true }) tierId: string,
        @Args({ name: 'tokenId', nullable: true, type: () => Int }) tokenId: number
    ): Promise<Nft> {
        let query: INftQuery = { id, tokenId };
        query = omitBy(query, isNil);
        if (collectionId) query.collection = { id: collectionId };
        if (tierId) query.tier = { id: tierId };
        return await this.nftService.getNftByQuery(query);
    }

    @Mutation(() => Nft, { description: 'Mutate a NFT for the given data.' })
    async createOrUpdateNft(@Args('input') input: CreateOrUpdateNftInput): Promise<Nft> {
        return await this.nftService.createOrUpdateNftByTokenId(input);
    }
}
