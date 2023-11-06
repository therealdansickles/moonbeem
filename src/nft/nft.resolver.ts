import { isNil, omitBy } from 'lodash';

import { Args, Mutation, Parent, Query, ResolveField, Resolver } from '@nestjs/graphql';

import { InstalledPluginInfo } from '../collectionPlugin/collectionPlugin.dto';
import { CollectionPluginService } from '../collectionPlugin/collectionPlugin.service';
import { Public } from '../session/session.decorator';
import {
    CreateOrUpdateNftInput,
    GetNftsPaginatedInput,
    Nft,
    NftPaginated,
    NftPropertiesSearchInput,
    NftPropertyOverview,
    UpdateNftPropertiesInput
} from './nft.dto';
import { INftWithPropertyAndCollection, NftService } from './nft.service';

@Resolver(() => Nft)
export class NftResolver {
    constructor(
        private readonly nftService: NftService,
        private readonly collectionPluginService: CollectionPluginService,
    ) {
    }

    @Public()
    @Query(() => Nft, { description: 'Get a specific NFT by id.', nullable: true })
    async nft(
        @Args({ name: 'id', nullable: true }) id: string,
            @Args({ name: 'collectionId', nullable: true }) collectionId: string,
            @Args({ name: 'tierId', nullable: true }) tierId: string,
            @Args({ name: 'tokenId', nullable: true, type: () => String }) tokenId: string,
    ): Promise<Nft> {
        let query: any = { id, tokenId };
        query = omitBy(query, isNil);
        if (collectionId) query.collection = { id: collectionId };
        if (tierId) query.tier = { id: tierId };
        return await this.nftService.getNft(query);
    }

    @Public()
    @Query(() => [Nft], { description: 'Get some NFTs by query.', nullable: true })
    async nfts(
        @Args({ name: 'collectionId', nullable: true }) collectionId?: string,
            @Args({ name: 'tierId', nullable: true }) tierId?: string,
            @Args({ name: 'tokenIds', nullable: true, type: () => [String] }) tokenIds?: string[],
            @Args({ name: 'ownerAddress', nullable: true }) ownerAddress?: string,
            @Args({
                name: 'properties',
                nullable: true,
                type: () => [NftPropertiesSearchInput],
            })
            properties?: NftPropertiesSearchInput[],
            @Args({
                name: 'plugins',
                nullable: true,
                type: () => [String],
            })
            plugins?: string[],
    ): Promise<Nft[]> {
        let query: any = { ownerAddress, tokenIds, properties };
        query = omitBy(query, isNil);
        if (collectionId) query.collection = { id: collectionId };
        if (tierId) query.tier = { id: tierId };
        if (plugins) query.plugins = plugins;
        return await this.nftService.getNfts(query);
    }

    @Public()
    @Query(() => NftPaginated, { description: 'Get NFTs by query.', nullable: true })
    async nftsPaginated(@Args({ name: 'input', nullable: false }) input: GetNftsPaginatedInput): Promise<NftPaginated> {
        const { collectionId, tierId, tokenIds, ownerAddress, properties, plugins, pagination } = input;
        let query: any = { ownerAddress, tokenIds, properties };
        query = omitBy(query, isNil);
        if (collectionId) query.collection = { id: collectionId };
        if (tierId) query.tier = { id: tierId };
        if (plugins) query.plugins = plugins;
        return this.nftService.getNftsPaginated(query, pagination);
    }

    @Public()
    @Query(() => [Nft], { description: 'Get NFTs with specific property.', nullable: true })
    async nftsByProperty(@Args({ name: 'collectionId' }) collectionId: string, @Args(
        { name: 'propertyName' }) propertyName: string): Promise<Nft[]> {
        const query: INftWithPropertyAndCollection = { collection: { id: collectionId }, propertyName };
        return await this.nftService.getNftByProperty(query);
    }

    @Public()
    @Query(() => NftPropertyOverview, { description: 'Returns the activity for collection' })
    async nftPropertyOverview(@Args({ name: 'collectionId' }) collectionId: string, @Args(
        { name: 'propertyName' }) propertyName: string) {
        const query: INftWithPropertyAndCollection = { collection: { id: collectionId }, propertyName };
        return await this.nftService.getOverviewByCollectionAndProperty(query);
    }

    @Public()
    @Mutation(() => Nft, { description: 'Mutate a NFT for the given data.' })
    async createOrUpdateNft(@Args('input') input: CreateOrUpdateNftInput): Promise<Nft> {
        return await this.nftService.createOrUpdateNftByTokenId(input);
    }

    @Public()
    @Mutation(() => Nft, { description: 'Mutate a NFT properties.' })
    async updateNftProperties(@Args('input') input: UpdateNftPropertiesInput): Promise<Nft> {
        return this.nftService.updateNftProperties(input);
    }

    @ResolveField(() => [InstalledPluginInfo], { description: 'The installed plugin info' })
    async pluginsInstalled(@Parent() nft: Nft): Promise<InstalledPluginInfo[]> {
        const {
            collection: { id: collectionId },
        } = nft;
        return await this.collectionPluginService.getTokenInstalledPlugins(collectionId, nft.tokenId);
    }
}
