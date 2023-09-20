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
            const result = await service.serializeNftActivityEvent(req);
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
            const result = await service.serializeNftActivityEvent(req);
            expect(result.length).toEqual(3);
        });
    });

    describe('#serializeAddressEvent', () => {
        it('should work for unexpected payload', async () => {
            const payload = {
                webhookId: 'wh_7ys2qwzmblyaof5l',
                id: 'whevt_d25e6k4gjslxbhgu',
                createdAt: '2023-09-20T16:15:57.642694504Z',
                type: 'ADDRESS_ACTIVITY',
                event: {
                    network: 'ARB_GOERLI',
                    activity: [{
                        fromAddress: '0xf07d553b195080f84f582e88ecdd54baa122b279',
                        toAddress: '0x0000000000000000000000000000000000000000',
                        blockNum: '0x9c63ff',
                        hash: '0xbdb82b9892f894f0b9d393e337028b68afca941d5595d13c3e653206c5a44571',
                        value: 30753.9047407863,
                        asset: '2CRV',
                        category: 'token',
                        rawContract: {
                            rawValue: '0x0000000000000000000000000000000000000000000006832c2a0c931130c1a9',
                            address: '0x7f90122bf0700f9e7e1f688fe926940e8839f353',
                            decimals: 18
                        },
                        log: {
                            address: '0x7f90122bf0700f9e7e1f688fe926940e8839f353',
                            topics: [
                                '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef',
                                '0x000000000000000000000000f07d553b195080f84f582e88ecdd54baa122b279',
                                '0x0000000000000000000000000000000000000000000000000000000000000000'
                            ],
                            data: '0x0000000000000000000000000000000000000000000006832c2a0c931130c1a9',
                            blockNumber: '0x9c63ff',
                            transactionHash: '0xbdb82b9892f894f0b9d393e337028b68afca941d5595d13c3e653206c5a44571',
                            transactionIndex: '0x0',
                            blockHash: '0x01f4502f3c905f8a5c0b46a55fdff99e88a845703cb46566d176e238e28e2622',
                            logIndex: '0x7',
                            removed: false
                        }
                    }, {
                        fromAddress: '0xf07d553b195080f84f582e88ecdd54baa122b279',
                        toAddress: '0x0000000000000000000000000000000000000000',
                        blockNum: '0x9c63ff',
                        hash: '0xbdb82b9892f894f0b9d393e337028b68afca941d5595d13c3e653206c5a44571',
                        value: 30753.9047407863,
                        asset: '2CRV-gauge',
                        category: 'token',
                        rawContract: {
                            rawValue: '0x0000000000000000000000000000000000000000000006832c2a0c931130c1a9',
                            address: '0xbf7e49483881c76487b0989cd7d9a8239b20ca41',
                            decimals: 18
                        },
                        log: {
                            address: '0xbf7e49483881c76487b0989cd7d9a8239b20ca41',
                            topics: [
                                '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef',
                                '0x000000000000000000000000f07d553b195080f84f582e88ecdd54baa122b279',
                                '0x0000000000000000000000000000000000000000000000000000000000000000'
                            ],
                            data: '0x0000000000000000000000000000000000000000000006832c2a0c931130c1a9',
                            blockNumber: '0x9c63ff',
                            transactionHash: '0xbdb82b9892f894f0b9d393e337028b68afca941d5595d13c3e653206c5a44571',
                            transactionIndex: '0x0',
                            blockHash: '0x01f4502f3c905f8a5c0b46a55fdff99e88a845703cb46566d176e238e28e2622',
                            logIndex: '0x6',
                            removed: false
                        }
                    }]
                }
            };
            const events = await service.serializeAddressActivityEvent(payload);
            expect(events).toBeTruthy();
            expect(events.length).toEqual(0);
        });

        it('should work for normal payload', async () => {
            const payload = {
                webhookId: 'wh_7ys2qwzmblyaof5l',
                id: 'whevt_zhh6badg8kb9n5iz',
                createdAt: '2023-09-20T16:39:44.203Z',
                type: 'ADDRESS_ACTIVITY',
                event: {
                    network: 'ARB_GOERLI',
                    activity: [{
                        fromAddress: '0x6532cf5d7acbeebd787381166df4ac782b8abf89',
                        toAddress: '0xd32baaaee8f50eeea535e1cf2083fee7edde0e1d',
                        blockNum: '0x28adfa9',
                        hash: '0x0b44f3eb913e3a2a2492db1eba31595a0868a72703f49a4849ccac2f75b5e628',
                        value: 0,
                        asset: 'ETH',
                        category: 'external',
                        rawContract: {
                            rawValue: '0x0',
                            decimals: 18
                        }
                    }]
                }
            };
            const mockLogResponse = [
                {
                    blockNumber: 42655657,
                    blockHash: '0x9eb46fd85cc1c734ea0ec14de80b92b6b783ae91ca9b9ad63f73c54d10c395ae',
                    transactionIndex: 1,
                    removed: false,
                    address: '0xd32BaAAeE8f50eEEa535E1cf2083FEe7EddE0E1D',
                    data: '0x00000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000140000000000000000000000000000000000000000000000000000000000000006000000000000000000000000000000000000000000000000000000000000000a000000000000000000000000000000000000000000000000000000000000000e00000000000000000000000000000000000000000000000000000000000000008616263766276616100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000045649424500000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000003f68747470733a2f2f6d657461646174612e766962652e78797a2f37326330643634332d393938662d343066302d613239332d6235303361373036393132302f00',
                    topics: [
                        '0xa60734e8967b392008a3ba4f23283bb78c4cb18c967d0bf1e6e74b2b57b0a3f5',
                        '0x0000000000000000000000006532cf5d7acbeebd787381166df4ac782b8abf89',
                        '0x0000000000000000000000001515ce5fa004ce9854ad8ebe207dc455048219c7'
                    ],
                    transactionHash: '0x0b44f3eb913e3a2a2492db1eba31595a0868a72703f49a4849ccac2f75b5e628',
                    logIndex: 3
                }, {
                    blockNumber: 42655657,
                    blockHash: '0x9eb46fd85cc1c734ea0ec14de80b92b6b783ae91ca9b9ad63f73c54d10c395ae',
                    transactionIndex: 1,
                    removed: false,
                    address: '0xd32BaAAeE8f50eEEa535E1cf2083FEe7EddE0E1D',
                    data: '0x000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000000e00000000000000000000000001515ce5fa004ce9854ad8ebe207dc455048219c7000000000000000000000000000000000000000000000000000000000000000a00000000000000000000000000000000000000000000000000000000650b203800000000000000000000000000000000000000000000000000000000651845ff0000000000000000000000000000000000000000000000000de0b6b3a7640000000000000000000000000000c0703aaa3c7db8410b998ef6c678ffb5fba271aa0000000000000000000000006532cf5d7acbeebd787381166df4ac782b8abf89',
                    topics: [
                        '0x4af645f691da920a84d533d7a7dab99767a323f4dd8646c6818330d57222a93e',
                        '0x0000000000000000000000006532cf5d7acbeebd787381166df4ac782b8abf89',
                        '0x000000000000000000000000533dca29aa090f90b46723c74d8047486777e5c3'
                    ],
                    transactionHash: '0x0b44f3eb913e3a2a2492db1eba31595a0868a72703f49a4849ccac2f75b5e628',
                    logIndex: 9
                }
            ];
            jest.spyOn(service as any, '_getLogs').mockImplementation(async () => mockLogResponse);
            const [{ tokenAddress, contractAddress }] = await service.serializeAddressActivityEvent(payload);
            expect(tokenAddress).toEqual('0x1515ce5fa004ce9854ad8ebe207dc455048219c7');
            expect(contractAddress).toEqual('0x533dca29aa090f90b46723c74d8047486777e5c3');
        });

        it('should work for royalty split payload', async () => {
            const payload = {
                webhookId: 'wh_7ys2qwzmblyaof5l',
                id: 'whevt_ulu5pa0lldwf4xzb',
                createdAt: '2023-09-20T16:37:13.423Z',
                type: 'ADDRESS_ACTIVITY',
                event: {
                    network: 'ARB_GOERLI',
                    activity: [{
                        fromAddress: '0x6532cf5d7acbeebd787381166df4ac782b8abf89',
                        toAddress: '0xd32baaaee8f50eeea535e1cf2083fee7edde0e1d',
                        blockNum: '0x28ade14',
                        hash: '0x6062d7684458699ef21c47ffe1e739dd7eb08b99f7d89c356fadc44ba3fed7ae',
                        value: 0,
                        asset: 'ETH',
                        category: 'external',
                        rawContract: {
                            rawValue: '0x0',
                            decimals: 18
                        }
                    }]
                }
            };
            const mockLogResponse = [
                {
                    blockNumber: 42659268,
                    blockHash: '0x104aa5d271b33294c154f6ecaa3f6d458618044f246c7e00d65cec33e5346586',
                    transactionIndex: 2,
                    removed: false,
                    address: '0xd32BaAAeE8f50eEEa535E1cf2083FEe7EddE0E1D',
                    data: '0x000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000000c0000000000000000000000000000000000000000000000000000000000000004000000000000000000000000000000000000000000000000000000000000000800000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000000000000000271000000000000000000000000000000000000000000000000000000000000000010000000000000000000000006532cf5d7acbeebd787381166df4ac782b8abf89',
                    topics: [
                        '0x12886d4fe42a80eebc6f310c8a6c2bc1021dfbb0b4f5c58074e4cb5b3d310688',
                        '0x0000000000000000000000006532cf5d7acbeebd787381166df4ac782b8abf89',
                        '0x000000000000000000000000e86b72ccdd1c61a6f5be5079786cbdf060dca5bb'
                    ],
                    transactionHash: '0x1eb1c3cdb124f5e1cec5318c9fb649818e85b1d36bbedb26536776bfd7003eda',
                    logIndex: 7
                }
            ];
            jest.spyOn(service as any, '_getLogs').mockImplementation(async () => mockLogResponse);
            const events = await service.serializeAddressActivityEvent(payload);
            expect(events).toBeTruthy();
            expect(events.length).toEqual(0);
        });
    });

    describe('#createWebhook', () => {
        it('should create webhook from Alchemy', async () => {
            const mockResponse = {
                id: 'wh_k59xn8hy0id8wxax',
                network: 'arb-goerli',
                type: 'NFT_ACTIVITY',
                url: 'https://ade0-139-226-93-94.ngrok-free.app/v1/webhook/nft-activity',
                isActive: true,
                timeCreated: '2023-09-15T01:53:32.000Z',
                signingKey: 'whsec_JDKbDFhVi96OUCNeOICMO3hq',
                version: 'V2'
            };
            jest.spyOn(service as any, '_createWebhook').mockImplementation(async () => mockResponse);
            const result = await service.createWebhook(Network.ARB_GOERLI, collection.tokenAddress);
            expect(result).toBeTruthy();
            expect(result.id).toEqual(mockResponse.id);
        });
    });
});
