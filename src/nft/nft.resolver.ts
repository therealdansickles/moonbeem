import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';

import { Nft, CreateOrUpdateNftInput } from './nft.dto';
import { NftService } from './nft.service';

@Resolver(() => Nft)
export class NftResolver {
    constructor(
        private readonly nftService: NftService,
    ) {}

    @Query(() => Nft, { description: 'Get a specific NFT by id.', nullable: true })
    async nft(@Args('id') id: string): Promise<Nft> {
        return await this.nftService.getNft(id);
    }

    @Mutation(() => Nft, { description: 'Mutate a NFT for the given data.' })
    async createOrUpdateNft(@Args('input') input: CreateOrUpdateNftInput): Promise<Nft> {
        return await this.nftService.createOrUpdateNftByTokenId(input);
    }
}
