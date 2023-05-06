import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Injectable } from '@nestjs/common';
import * as MintSaleContractEntity from './mint-sale-contract.entity';
import {
    CreateMerkleRootData,
    CreateMerkleRootInput,
    CreateMerkleRootOutput,
    GetMerkleProofOutput,
    MintSaleContract,
} from './mint-sale-contract.dto';
import { StandardMerkleTree } from '@openzeppelin/merkle-tree';
import { MongoAdapter } from '../../lib/adapters/mongo.adapter';
import { encodeAddressAndAmount } from '../../lib/utilities/merkle';
import { keccak256 } from 'ethers/lib/utils';
import { Factory } from '../factory/factory.entity';
import { FactoryService } from '../factory/factory.service';
// import { MerkleTree } from 'merkletreejs';
const { MerkleTree } = require('merkletreejs');

@Injectable()
export class MintSaleContractService {
    constructor(
        @InjectRepository(MintSaleContractEntity.MintSaleContract, 'sync_chain')
        private readonly contractRepository: Repository<MintSaleContractEntity.MintSaleContract>,
        private factoreService: FactoryService,
        private readonly mongoRepository: MongoAdapter
    ) {}

    async createMintSaleContract(data: any): Promise<MintSaleContract> {
        return await this.contractRepository.save(data);
    }

    async getMintSaleContract(id: string): Promise<MintSaleContract> {
        return await this.contractRepository.findOneBy({ id });
    }

    async getMintSaleContractByCollection(collectionId: string): Promise<MintSaleContract> {
        const contract = await this.contractRepository.findOneBy({ collectionId });
        if (!contract) {
            return null;
        }

        const factory = await this.factoreService.getFactoryByAddress(contract.address);
        return {
            ...contract,
            kind: factory?.kind,
        };
    }

    async createMerkleRoot(input: CreateMerkleRootInput): Promise<CreateMerkleRootOutput> {
        // Create merkle root
        const tree = this.createMerkleTree(input.data);

        // save on mongodb
        let mongoData: any = { root: tree.getHexRoot(), data: input.data };
        if (input.organization) mongoData.organizationId = input.organization.id;

        const merkleRecord = await this.mongoRepository.db
            .collection('merkleTree')
            .findOne({ root: tree.getHexRoot() });
        if (!merkleRecord) await this.mongoRepository.db.collection('merkleTree').insertOne(mongoData);

        return { success: true, merkleRoot: tree.getHexRoot() };
    }

    async getMerkleProof(address: string, merkleRoot: string): Promise<GetMerkleProofOutput> {
        const merkleTreeData = await this.mongoRepository.db.collection('merkleTree').findOne({ root: merkleRoot });
        if (!merkleTreeData) throw new Error('Invalid Merkle Tree');
        const tree = this.createMerkleTree(merkleTreeData.data);

        for (let data of merkleTreeData.data as CreateMerkleRootData[]) {
            if (data.address.toLocaleLowerCase() == address.toLocaleLowerCase()) {
                const merkleProof = tree.getHexProof(encodeAddressAndAmount(data.address, parseInt(data.amount)));
                return {
                    address: data.address.toLocaleLowerCase(),
                    amount: data.amount,
                    proof: merkleProof,
                    success: true,
                };
            }
        }
    }

    private createMerkleTree(data: CreateMerkleRootData[]) {
        const leaves = [];
        for (let d of data) {
            leaves.push(encodeAddressAndAmount(d.address, parseInt(d.amount)));
        }
        const tree = new MerkleTree(leaves, keccak256, { sort: true });
        return tree;
    }
}
