import { Network } from 'alchemy-sdk';

import { faker } from '@faker-js/faker';

import { CollectionService } from '../collection/collection.service';
import { createCoin, createCollection, createMintSaleContract, createTier } from '../test-utils';
import { TierService } from '../tier/tier.service';
import { AlchemyService } from './alchemy.service';

describe('AlchemySerice', () => {
    let service: AlchemyService;
    let collectionService: CollectionService;
    let collection;
    let tierService: TierService;
    let tier;

    beforeAll(async () => {
        service = global.alchemyService;
        const coinService = global.coinService;
        const coin = await createCoin(coinService);
        collectionService = global.collectionService;
        collection = await createCollection(collectionService, { tokenAddress: faker.finance.ethereumAddress() });
        const mintSaleContractService = global.mintSaleContractService;
        await createMintSaleContract(mintSaleContractService, { collectionId: collection.id, startId: 1, endId: 100, tierId: 0 });
        await createMintSaleContract(mintSaleContractService, { collectionId: collection.id, startId: 101, endId: 200, tierId: 1 });
        tierService = global.tierService;
        await createTier(tierService, {
            collection: { id: collection.id },
            paymentTokenAddress: coin.address,
            tierId: 0
        });
        tier = await createTier(tierService, {
            collection: { id: collection.id },
            paymentTokenAddress: coin.address,
            tierId: 1
        });
    });

    describe('#getEventTypeByAddress', () => {
        it('should identify `mint` event', () => {
            const result = service.getEventTypeByAddress('0x0000000000000000000000000000000000000000', faker.finance.ethereumAddress());
            expect(result).toEqual('mint');
        });

        it('should identify `burn` event', () => {
            const result = service.getEventTypeByAddress(faker.finance.ethereumAddress(), '0x0000000000000000000000000000000000000000');
            expect(result).toEqual('burn');
        });

        it('should identify `tranfer` event', () => {
            const result = service.getEventTypeByAddress(faker.finance.ethereumAddress(), faker.finance.ethereumAddress());
            expect(result).toEqual('transfer');
        });

        it('should identify `unknown` event', () => {
            const result = service.getEventTypeByAddress('0x0000000000000000000000000000000000000000', '0x0000000000000000000000000000000000000000');
            expect(result).toEqual('unknown');
        });
    });

    describe('#getNFTsForCollection', () => {
        jest.setTimeout(600000);
        
        it('should work', async () => {
            const mockResponse = [
                {
                    'id': {
                        'tokenId': '0x0000000000000000000000000000000000000000000000000000000000000000'
                    }
                },
                {
                    'id': {
                        'tokenId': '0x0000000000000000000000000000000000000000000000000000000000000001'
                    }
                },
                {
                    'id': {
                        'tokenId': '0x0000000000000000000000000000000000000000000000000000000000000002'
                    }
                },
                {
                    'id': {
                        'tokenId': '0x0000000000000000000000000000000000000000000000000000000000000003'
                    }
                },
                {
                    'id': {
                        'tokenId': '0x0000000000000000000000000000000000000000000000000000000000000004'
                    }
                },
                {
                    'id': {
                        'tokenId': '0x0000000000000000000000000000000000000000000000000000000000000005'
                    }
                },
                {
                    'id': {
                        'tokenId': '0x0000000000000000000000000000000000000000000000000000000000000006'
                    }
                },
                {
                    'id': {
                        'tokenId': '0x0000000000000000000000000000000000000000000000000000000000000007'
                    }
                },
                {
                    'id': {
                        'tokenId': '0x0000000000000000000000000000000000000000000000000000000000000008'
                    }
                },
                {
                    'id': {
                        'tokenId': '0x0000000000000000000000000000000000000000000000000000000000000009'
                    }
                }
            ];

            jest.spyOn(service as any, '_getNFTsForCollection').mockImplementation(async () => mockResponse);
            const result = await service.getNFTsForCollection(Network.ARB_GOERLI, faker.finance.ethereumAddress());
            expect(result.length).toEqual(mockResponse.length);
            expect(result[5]).toEqual(BigInt(mockResponse[5].id.tokenId).toString());
        });

        it.skip('should work for realworld', async () => {
            // PETGPT CAT SCIENTIST
            // 600 items
            // 0x82ca7a988682bfe216d9b38d2dd0f26599417f0e
            // GMX Blueberry Club
            // 10000 items
            // 0x17f4baa9d35ee54ffbcb2608e20786473c7aa49f
            const contract = {
                tokenAddress: '0x82ca7a988682bfe216d9b38d2dd0f26599417f0e',
                itemsTotal: 600
            };
            const result = await service.getNFTsForCollection(Network.ARB_MAINNET, contract.tokenAddress);
            expect(result.length).toEqual(contract.itemsTotal);
        });
    });

    describe('#serializeActivityEvent', () => {
        it('should serialize event from webhook', async () => {
            const req = {
                'webhookId': 'wh_tconj0eytlvxllux',
                'id': 'whevt_bm5nbftkzbkcejmd',
                'createdAt': '2023-08-29T09:15:40.651Z',
                'type': 'NFT_ACTIVITY',
                'event': {
                    'network': 'ARB_GOERLI',
                    'activity': [{
                        'fromAddress': '0x0000000000000000000000000000000000000000',
                        'toAddress': '0x6532cf5d7acbeebd787381166df4ac782b888888',
                        'contractAddress': collection.tokenAddress,
                        'blockNum': '0x23c4852',
                        'hash': '0x7433d17e87888faf38bba59626fb4bd80683f55c355f3c485ce90fd0dcc16b4c',
                        'erc721TokenId': '0x96',
                        'category': 'erc721',
                        'log': {
                            'address': '0xc2eba41f196c8fb35f60a3a96ae210da8d7f23f6',
                            'topics': ['0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef', '0x0000000000000000000000000000000000000000000000000000000000000000', '0x0000000000000000000000006532cf5d7acbeebd787381166df4ac782b8abf89', '0x0000000000000000000000000000000000000000000000000000000000000003'],
                            'data': '0x',
                            'blockNumber': '0x23c4852',
                            'transactionHash': '0x7433d17e87888faf38bba59626fb4bd80683f55c355f3c485ce90fd0dcc16b4c',
                            'transactionIndex': '0x1',
                            'blockHash': '0x53d7f7f119511472c5c86e9ec81b7a733df145814045936e6547310cab6d6955',
                            'logIndex': '0x0',
                            'removed': false
                        }
                    }]
                }
            };
            const result = await service.serializeActivityEvent(req);
            expect(result.length).toEqual(1);
            expect(result[0].eventType).toEqual('mint');
            expect(result[0].tokenId).toEqual('150');
            expect(result[0].collectionId).toEqual(collection.id);
            expect(result[0].tierId).toEqual(tier.id);
        });

        it('should handle mixed event', async () => {
            const req = {
                'webhookId': 'wh_tconj0eytlvxllux',
                'id': 'whevt_bm5nbftkzbkcejmd',
                'createdAt': '2023-08-29T09:15:40.651Z',
                'type': 'NFT_ACTIVITY',
                'event': {
                    'network': 'ARB_GOERLI',
                    'activity': [{
                        'fromAddress': '0x0000000000000000000000000000000000000000',
                        'toAddress': '0x6532cf5d7acbeebd787381166df4ac782b888888',
                        'contractAddress': collection.tokenAddress,
                        'blockNum': '0x23c4852',
                        'hash': '0x7433d17e87888faf38bba59626fb4bd80683f55c355f3c485ce90fd0dcc16b4c',
                        'erc721TokenId': '0x3',
                        'category': 'erc721',
                        'log': {
                            'address': collection.tokenAddress,
                            'topics': ['0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef', '0x0000000000000000000000000000000000000000000000000000000000000000', '0x0000000000000000000000006532cf5d7acbeebd787381166df4ac782b8abf89', '0x0000000000000000000000000000000000000000000000000000000000000003'],
                            'data': '0x',
                            'blockNumber': '0x23c4852',
                            'transactionHash': '0x7433d17e87888faf38bba59626fb4bd80683f55c355f3c485ce90fd0dcc16b4c',
                            'transactionIndex': '0x1',
                            'blockHash': '0x53d7f7f119511472c5c86e9ec81b7a733df145814045936e6547310cab6d6955',
                            'logIndex': '0x0',
                            'removed': false
                        }
                    }, {
                        'fromAddress': '0x6532cf5d7acbeebd787381166df4ac782b888888',
                        'toAddress': '0x0000000000000000000000000000000000000000',
                        'contractAddress': collection.tokenAddress,
                        'blockNum': '0x23c4852',
                        'hash': '0x7433d17e87888faf38bba59626fb4bd80683f55c355f3c485ce90fd0dcc16b4c',
                        'erc721TokenId': '0x3',
                        'category': 'erc721',
                        'log': {
                            'address': collection.tokenAddress,
                            'topics': ['0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef', '0x0000000000000000000000000000000000000000000000000000000000000000', '0x0000000000000000000000006532cf5d7acbeebd787381166df4ac782b8abf89', '0x0000000000000000000000000000000000000000000000000000000000000003'],
                            'data': '0x',
                            'blockNumber': '0x23c4852',
                            'transactionHash': '0x7433d17e87888faf38bba59626fb4bd80683f55c355f3c485ce90fd0dcc16b4c',
                            'transactionIndex': '0x1',
                            'blockHash': '0x53d7f7f119511472c5c86e9ec81b7a733df145814045936e6547310cab6d6955',
                            'logIndex': '0x0',
                            'removed': false
                        }
                    }, {
                        'fromAddress': '0x6532cf5d7acbeebd787381166df4ac782b888888',
                        'toAddress': '0x6532cf5d7acbeebd787381166df4ac782b888888',
                        'contractAddress': collection.tokenAddress,
                        'blockNum': '0x23c4852',
                        'hash': '0x7433d17e87888faf38bba59626fb4bd80683f55c355f3c485ce90fd0dcc16b4c',
                        'erc721TokenId': '0x3',
                        'category': 'erc721',
                        'log': {
                            'address': collection.tokenAddress,
                            'topics': ['0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef', '0x0000000000000000000000000000000000000000000000000000000000000000', '0x0000000000000000000000006532cf5d7acbeebd787381166df4ac782b8abf89', '0x0000000000000000000000000000000000000000000000000000000000000003'],
                            'data': '0x',
                            'blockNumber': '0x23c4852',
                            'transactionHash': '0x7433d17e87888faf38bba59626fb4bd80683f55c355f3c485ce90fd0dcc16b4c',
                            'transactionIndex': '0x1',
                            'blockHash': '0x53d7f7f119511472c5c86e9ec81b7a733df145814045936e6547310cab6d6955',
                            'logIndex': '0x0',
                            'removed': false
                        }
                    }]
                }
            };
            const result = await service.serializeActivityEvent(req);
            expect(result.length).toEqual(3);
        });
    });
});
