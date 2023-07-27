import { keccak256 } from 'ethers';
import { GraphQLError } from 'graphql';
import { MerkleTree as MerkleTreejs } from 'merkletreejs';
import { Repository } from 'typeorm';

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { encodeAddressAndAmount } from '../lib/utilities/merkle';
import { MintSaleContract } from '../sync-chain/mint-sale-contract/mint-sale-contract.entity';
import {
    MintSaleTransaction
} from '../sync-chain/mint-sale-transaction/mint-sale-transaction.entity';
import { CreateMerkleRootInput, MerkleDataInput, MerkleProofOutput } from './merkleTree.dto';
import { MerkleTree } from './merkleTree.entity';

@Injectable()
export class MerkleTreeService {
    constructor(
        @InjectRepository(MerkleTree) private readonly repository: Repository<MerkleTree>,
        @InjectRepository(MintSaleContract, 'sync_chain')
        private readonly contractRepository: Repository<MintSaleContract>,
        @InjectRepository(MintSaleTransaction, 'sync_chain')
        private readonly transactionRepository: Repository<MintSaleTransaction>
    ) {}

    async createMerkleTree(input: CreateMerkleRootInput): Promise<MerkleTree> {
        if (input.data.length == 0) {
            throw new GraphQLError('The length of data cannot be 0.', { extensions: { code: 'BAD_REQUEST' } });
        }
        const tree = this.generateMerkleRoot(input.data);
        const existedTree = await this.getMerkleTree(tree.getHexRoot());
        if (existedTree) return existedTree;

        const data = { merkleRoot: tree.getHexRoot(), data: input.data };
        return this.repository.save(data);
    }

    /**
     * create or update a merkle tree
     * calculate the merkle root depends on the given input
     * if the
     * 
     * @param input
     */
    async createOrUpdateMerkleTree(input: CreateMerkleRootInput): Promise<MerkleTree> {
        if (input.data.length == 0) {
            throw new GraphQLError('The length of data cannot be 0.', { extensions: { code: 'BAD_REQUEST' } });
        }
        const tree = this.generateMerkleRoot(input.data);
        const existedTree = await this.getMerkleTree(tree.getHexRoot());
        if (existedTree) return existedTree;

        const data = { merkleRoot: tree.getHexRoot(), data: input.data };
        return this.repository.save(data);
    }

    private generateMerkleRoot(data: MerkleDataInput[]): MerkleTreejs {
        const leaves = data.map((d) => {
            return encodeAddressAndAmount(d.address, parseInt(d.amount));
        });
        return new MerkleTreejs(leaves, keccak256, { sort: true });
    }

    async getMerkleTree(merkleRoot: string): Promise<MerkleTree> {
        return await this.repository.findOneBy({ merkleRoot });
    }

    async getMerkleProof(
        address: string,
        merkleRoot: string,
        collectionAddress?: string,
        tierId?: number
    ): Promise<MerkleProofOutput> {
        const merkleTree = await this.repository.findOneBy({ merkleRoot });
        if (!merkleTree) throw new Error('Invalid Merkle Tree');

        const tree = this.generateMerkleRoot(merkleTree.data);
        for (const data of merkleTree.data) {
            if (data.address.toLocaleLowerCase() == address.toLocaleLowerCase()) {
                const merkleProof = tree.getHexProof(encodeAddressAndAmount(data.address, parseInt(data.amount)));

                let count = 0;
                if (collectionAddress) {
                    const contract = await this.contractRepository.findOneBy({
                        address: collectionAddress.toLowerCase(),
                        tierId: tierId ? tierId : 0,
                    });
                    if (contract.merkleRoot != merkleRoot) {
                        throw new GraphQLError('The merkleRoot on this collection is invalid.', {
                            extensions: { code: 'BAD_REQUEST' },
                        });
                    }

                    count = await this.transactionRepository.count({
                        where: {
                            recipient: address.toLowerCase(),
                            tierId: tierId,
                            address: collectionAddress.toLowerCase(),
                        },
                    });
                }
                return {
                    address: data.address.toLocaleLowerCase(),
                    amount: data.amount,
                    proof: merkleProof,
                    usable: parseInt(data.amount) - count,
                };
            }
        }
    }
}
