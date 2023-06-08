import { Args, Resolver, Query, Mutation } from '@nestjs/graphql';
import { Public } from '../../session/session.decorator';
import { MintSaleContractService } from './mint-sale-contract.service';
import {
    CreateMerkleRootInput,
    CreateMerkleRootOutput,
    GetMerkleProofOutput,
    MintSaleContract,
} from './mint-sale-contract.dto';

@Resolver('MintSaleContract')
export class MintSaleContractResolver {
    constructor(private readonly mintSaleContractService: MintSaleContractService) {}

    @Public()
    @Query(() => MintSaleContract, { description: 'returns a contract for a given uuid' })
    async mintSaleContract(@Args('id') id: string): Promise<MintSaleContract> {
        return await this.mintSaleContractService.getMintSaleContract(id);
    }

    @Public()
    @Mutation(() => CreateMerkleRootOutput, { description: 'Create merekleTree' })
    async createMerkleRoot(@Args('input') input: CreateMerkleRootInput): Promise<CreateMerkleRootOutput> {
        return await this.mintSaleContractService.createMerkleRoot(input);
    }

    @Public()
    @Query(() => GetMerkleProofOutput, { nullable: true, description: 'Merkle Tree Verify' })
    async getMerkleProof(
        @Args('address') address: string,
        @Args('merkleRoot') merkleRoot: string,
        @Args('collectionAddress', { nullable: true, description: '' }) collectionAddress?: string,
        @Args('tierId', { nullable: true, description: '' }) tierId?: number
    ): Promise<GetMerkleProofOutput> {
        return await this.mintSaleContractService.getMerkleProof(address, merkleRoot, collectionAddress, tierId);
    }
}
