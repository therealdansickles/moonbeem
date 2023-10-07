import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { keccak256 } from 'ethers';
import { Repository } from 'typeorm';
import { encodeAddressAndAmount, encodeLeafData, generateMerkleRoot, isValidType } from '../lib/utilities/merkle';
import {
    CreateMerkleRootInput,
    GeneralMerkleProofOutput,
    MerkleDataInput,
    MerkleProofOutput,
    MerkleTreeType
} from './merkleTree.dto';
import { MerkleTree } from './merkleTree.entity';
import { MerkleTree as MerkleTreejs } from 'merkletreejs';
import { GraphQLError } from 'graphql';
import { MintSaleContract } from '../sync-chain/mint-sale-contract/mint-sale-contract.entity';
import { MintSaleTransaction } from '../sync-chain/mint-sale-transaction/mint-sale-transaction.entity';

@Injectable()
export class MerkleTreeService {
    constructor(
        @InjectRepository(MerkleTree) private readonly repository: Repository<MerkleTree>,
        @InjectRepository(MintSaleContract, 'sync_chain')
        private readonly contractRepository: Repository<MintSaleContract>,
        @InjectRepository(MintSaleTransaction, 'sync_chain')
        private readonly transactionRepository: Repository<MintSaleTransaction>
    ) {
    }

    async createMerkleTree(input: CreateMerkleRootInput): Promise<MerkleTree> {
        if (input.data.length == 0) {
            throw new GraphQLError('The length of data cannot be 0.', { extensions: { code: 'BAD_REQUEST' } });
        }
        const tree = this.generateMerkleRootByAddressAndAmount(input.data);
        const existedTree = await this.getMerkleTree(tree.getHexRoot());
        if (existedTree) return existedTree;

        const data = { merkleRoot: tree.getHexRoot(), data: input.data };
        return this.repository.save(data);
    }

    private generateMerkleRootByAddressAndAmount(data: MerkleDataInput[]): MerkleTreejs {
        const leaves = data.map((d) => {
            return encodeAddressAndAmount(d.address, parseInt(d.amount));
        });
        return new MerkleTreejs(leaves, keccak256, { sort: true });
    }

    async getMerkleTree(merkleRoot: string): Promise<MerkleTree> {
        if (!merkleRoot) return;
        return await this.repository.findOneBy({ merkleRoot });
    }

    async getMerkleProof(address: string, merkleRoot: string, collectionAddress?: string, tierId?: number): Promise<MerkleProofOutput> {
        const merkleTree = await this.repository.findOneBy({ merkleRoot });
        if (!merkleTree) return;

        const tree = this.generateMerkleRootByAddressAndAmount(merkleTree.data);
        for (const data of merkleTree.data) {
            if (data.address.toLocaleLowerCase() == address.toLocaleLowerCase()) {
                const merkleProof = tree.getHexProof(encodeAddressAndAmount(data.address, parseInt(data.amount)));

                let usable = parseInt(data.amount);
                if (collectionAddress) {
                    const contract = await this.contractRepository.findOneBy({
                        address: collectionAddress.toLowerCase(),
                        tierId: tierId ? tierId : 0,
                    });

                    if (!contract || contract.merkleRoot != merkleRoot) {
                        usable = -1;
                    } else {
                        const used = await this.transactionRepository.count({
                            where: {
                                recipient: address.toLowerCase(),
                                tierId: tierId,
                                address: collectionAddress.toLowerCase(),
                            },
                        });
                        usable -= used;
                    }
                }

                return {
                    address: data.address.toLocaleLowerCase(),
                    amount: data.amount,
                    proof: merkleProof,
                    usable: usable,
                };
            }
        }
    }

    async createGeneralMerkleTree(type: MerkleTreeType, data: object[]): Promise<MerkleTree> {
        if (data.length == 0) {
            throw new GraphQLError('The length of data cannot be 0.', { extensions: { code: 'BAD_REQUEST' } });
        }
        if (!isValidType(type)) {
            throw new GraphQLError('Invalid type provided.', { extensions: { code: 'BAD_REQUEST' } });
        }
        let tree;
        try {
            tree = generateMerkleRoot(type, data);
        } catch (e) {
            throw new GraphQLError('Invalid data provided.', { extensions: { code: 'BAD_REQUEST' } });
        }
        const existedTree = await this.getMerkleTree(tree.getHexRoot());
        if (existedTree) return existedTree;

        const merkleTree = { merkleRoot: tree.getHexRoot(), data };
        return this.repository.save(merkleTree);
    }

    async getGeneralMerkleProof(merkleRoot: string, type: MerkleTreeType, leaf: object): Promise<GeneralMerkleProofOutput> {
        if (!isValidType(type)) {
            throw new GraphQLError('Invalid type provided.', { extensions: { code: 'BAD_REQUEST' } });
        }
        const merkleTree = await this.repository.findOneBy({ merkleRoot });
        if (!merkleTree) return;

        const tree = generateMerkleRoot(type, merkleTree.data);
        const proof = tree.getHexProof(encodeLeafData(type, leaf));
        return {
            proof,
            leafData: leaf,
        };
    }
}
