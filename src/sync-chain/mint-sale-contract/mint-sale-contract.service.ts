import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Injectable } from '@nestjs/common';
import { MerkleTree, MintSaleContract, StandardMerkleTreeData } from './mint-sale-contract.entity';
import { CreateMerkleRootInput, CreateMerkleRootOutput, GetMerkleProofOutput } from './mint-sale-contract.dto';
import { StandardMerkleTree } from '@openzeppelin/merkle-tree';
import { MongoAdapter } from '../../lib/adapters/mongo.adapter';

@Injectable()
export class MintSaleContractService {
    constructor(
        @InjectRepository(MintSaleContract, 'sync_chain')
        private readonly contractRepository: Repository<MintSaleContract>,
        private readonly mongoRepository: MongoAdapter
    ) {}

    async createMintSaleContract(data: any): Promise<MintSaleContract> {
        return await this.contractRepository.save(data);
    }

    async getMintSaleContract(id: string): Promise<MintSaleContract> {
        return await this.contractRepository.findOneBy({ id });
    }

    async createMerkleRoot(input: CreateMerkleRootInput): Promise<CreateMerkleRootOutput> {
        // Create merkle root
        let values: string[][] = [];
        input.data.forEach((user) => {
            values.push([user.address, user.amount]);
        });
        const tree = StandardMerkleTree.of(values, ['address', 'uint256']);

        // save on mongodb
        let mongoData: MerkleTree = { root: tree.root, data: tree.dump() };
        if (input.organization) mongoData.organizationId = input.organization.id;

        const merkleRecord = await this.mongoRepository.db.collection('merkleTree').findOne({ root: tree.root });
        if (!merkleRecord) await this.mongoRepository.db.collection('merkleTree').insertOne(mongoData);

        return { success: true, merkleRoot: tree.root };
    }

    async getMerkleProof(address: string, merkleRoot: string): Promise<GetMerkleProofOutput> {
        const merkleTreeData = await this.mongoRepository.db.collection('merkleTree').findOne({ root: merkleRoot });
        if (!merkleTreeData) throw new Error('Invalid Merkle Tree');

        const tree = StandardMerkleTree.load(merkleTreeData.data as StandardMerkleTreeData<string[]>);
        for (let [i, v] of tree.entries()) {
            if (v[0].toLowerCase() == address.toLowerCase()) {
                return { address: v[0], amount: v[1], proof: tree.getProof(i), success: true };
            }
        }
    }
}
