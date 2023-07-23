import { Args, Mutation, Resolver, Query } from '@nestjs/graphql';
import { Public } from '../session/session.decorator';
import { CreateMerkleRootInput, MerkleProofOutput, MerkleTree } from './merkleTree.dto';
import { MerkleTreeService } from './merkleTree.service';

@Resolver(() => MerkleTree)
export class MerkleTreeResolver {
    constructor(private readonly merkleTreeService: MerkleTreeService) {}

    @Public()
    @Query(() => MerkleTree, { nullable: true, description: 'get merkle tree' })
    async merkleTree(@Args({ name: 'merkleRoot', nullable: true }) merkleRoot: string): Promise<MerkleTree> {
        return this.merkleTreeService.getMerkleTree(merkleRoot);
    }

    @Public()
    @Mutation(() => MerkleTree, { description: 'Create merkle tree.' })
    async createMerkleTree(@Args('input') input: CreateMerkleRootInput): Promise<MerkleTree> {
        return this.merkleTreeService.createMerkleTree(input);
    }

    @Public()
    @Query(() => MerkleProofOutput, { nullable: true, description: 'Merkle Tree Verify' })
    async merkleProof(
        @Args('address') address: string,
            @Args('merkleRoot') merkleRoot: string,
            @Args('collectionAddress', { nullable: true, description: 'the contract address for the collection' }) collectionAddress?: string,
            @Args('tierId', { nullable: true, description: 'the id of the tier' }) tierId?: number
    ): Promise<MerkleProofOutput> {
        return await this.merkleTreeService.getMerkleProof(address, merkleRoot, collectionAddress, tierId);
    }
}
