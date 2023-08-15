import { isNil, omitBy } from 'lodash';

import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';

import { Public } from '../session/session.decorator';
import { CreateOrUpdateNftInput, Nft } from './nft.dto';
import { INftListQuery, INftQuery, NftService } from './nft.service';

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
            @Args({ name: 'tokenId', nullable: true, type: () => String }) tokenId: string,
    ): Promise<Nft> {
        let query: INftQuery = { id, tokenId, collection: { id: collectionId }, tier: { id: tierId } };
        query = omitBy(query, isNil);
        return await this.nftService.getNft(query);
    }

    @Public()
    @Query(() => [Nft], { description: 'Get some NFTs by query.', nullable: true })
    async nfts(
        @Args({ name: 'collectionId', nullable: true }) collectionId: string,
            @Args({ name: 'tierId', nullable: true }) tierId: string,
            @Args({ name: 'tokenIds', nullable: true, type: () => [String] }) tokenIds?: string[]
    ): Promise<Nft[]> {
        let query: INftListQuery = { collection: { id: collectionId }, tier: { id: tierId }, tokenIds };
        query = omitBy(query, isNil);
        return await this.nftService.getNfts(query);
    }

    @Mutation(() => Nft, { description: 'Mutate a NFT for the given data.' })
    async createOrUpdateNft(@Args('input') input: CreateOrUpdateNftInput): Promise<Nft> {
        return await this.nftService.createOrUpdateNftByTokenId(input);
    }
}
