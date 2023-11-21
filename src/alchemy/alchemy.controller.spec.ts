import { faker } from '@faker-js/faker';

import { MaasService } from '../maas/maas.service';
import { createCoin, createCollection, createMintSaleContract, createTier } from '../test-utils';
import { AlchemyController } from './alchemy.controller';

describe('AlchemyController', () => {
    let controller;
    let collection;
    let nftService;

    beforeAll(async () => {
        const { alchemyService, collectionService, tierService, coinService, maasService } = global as any;
        nftService = global.nftService;
        const coin = await createCoin(coinService);
        const tokenAddress = faker.finance.ethereumAddress();
        collection = await createCollection(collectionService, { tokenAddress });
        const mintSaleContractService = global.mintSaleContractService;
        await createMintSaleContract(mintSaleContractService, {
            collectionId: collection.id,
            startId: 1,
            endId: 100,
            tierId: 0,
            tokenAddress,
        });
        await createMintSaleContract(mintSaleContractService, {
            collectionId: collection.id,
            startId: 101,
            endId: 200,
            tierId: 1,
            tokenAddress,
        });
        await createTier(tierService, {
            collection: { id: collection.id },
            paymentTokenAddress: coin.address,
            tierId: 0,
            metadata: {
                uses: ['@vibelabs/referral'],
                properties: {
                    level: {
                        name: '{{level}}',
                        type: 'string',
                        value: 'basic',
                        display_value: 'Basic',
                    },
                    holding_days: {
                        name: '{{holding_days}}',
                        type: 'integer',
                        value: 125,
                        display_value: 'Days of holding',
                    },
                },
            },
        });
        await createTier(tierService, {
            collection: { id: collection.id },
            paymentTokenAddress: coin.address,
            tierId: 1,
        });

        jest.spyOn(maasService, 'handleLoyaltyPointsTransfer').mockImplementation(
            () => ({ before: 10, after: 10 })) as unknown as MaasService;
        controller = new AlchemyController(alchemyService, collectionService, tierService, nftService, maasService);
    });

    describe('nftActivity', () => {
        it('should serialize MINT event', async () => {
            // tier 0
            const tokenId = faker.number.int({ min: 1, max: 100 });
            const hexHokenId = '0x' + tokenId.toString(16);
            const request = {
                webhookId: 'wh_tconj0eytlvxllux',
                id: 'whevt_bm5nbftkzbkcejmd',
                createdAt: '2023-08-29T09:15:40.651Z',
                type: 'NFT_ACTIVITY',
                event: {
                    network: 'ARB_GOERLI',
                    activity: [
                        {
                            fromAddress: '0x0000000000000000000000000000000000000000',
                            toAddress: '0x6532cf5d7acbeebd787381166df4ac782b888888',
                            contractAddress: collection.tokenAddress,
                            blockNum: '0x23c4852',
                            hash: '0x7433d17e87888faf38bba59626fb4bd80683f55c355f3c485ce90fd0dcc16b4c',
                            erc721TokenId: hexHokenId,
                            category: 'erc721',
                            log: {
                                address: '0xc2eba41f196c8fb35f60a3a96ae210da8d7f23f6',
                                topics: [
                                    '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef',
                                    '0x0000000000000000000000000000000000000000000000000000000000000000',
                                    '0x0000000000000000000000006532cf5d7acbeebd787381166df4ac782b8abf89',
                                    '0x0000000000000000000000000000000000000000000000000000000000000003',
                                ],
                                data: hexHokenId,
                                blockNumber: '0x23c4852',
                                transactionHash: '0x7433d17e87888faf38bba59626fb4bd80683f55c355f3c485ce90fd0dcc16b4c',
                                transactionIndex: '0x1',
                                blockHash: '0x53d7f7f119511472c5c86e9ec81b7a733df145814045936e6547310cab6d6955',
                                logIndex: '0x0',
                                removed: false,
                            },
                        },
                    ],
                },
            };
            await controller.nftActivity({ body: request });

            const nft = await nftService.getNft({ collection: { id: collection.id }, tokenId: tokenId.toString() });
            expect(nft.collection.id).toEqual(collection.id);
            expect(nft.properties).toBeTruthy();
            expect(nft.properties.level).toBeTruthy();
            expect(nft.properties.holding_days).toBeTruthy();
            expect(nft.properties.holding_days.value).toEqual(125);
            expect(nft.properties.referral_code).toBeDefined();
            expect(nft.properties.referral_code.name).toEqual('Referral Code');
            expect(nft.properties.referral_code.value.length).toEqual(10);
        });

        it('should serialize the MINT event if the tier doesn\'t have metadata or metadata.properties', async () => {
            // tier 1
            const tokenId = faker.number.int({ min: 100, max: 200 });
            const hexHokenId = '0x' + tokenId.toString(16);
            const request = {
                webhookId: 'wh_tconj0eytlvxllux',
                id: 'whevt_bm5nbftkzbkcejmd',
                createdAt: '2023-08-29T09:15:40.651Z',
                type: 'NFT_ACTIVITY',
                event: {
                    network: 'ARB_GOERLI',
                    activity: [
                        {
                            fromAddress: '0x0000000000000000000000000000000000000000',
                            toAddress: '0x6532cf5d7acbeebd787381166df4ac782b888888',
                            contractAddress: collection.tokenAddress,
                            blockNum: '0x23c4852',
                            hash: '0x7433d17e87888faf38bba59626fb4bd80683f55c355f3c485ce90fd0dcc16b4c',
                            erc721TokenId: hexHokenId,
                            category: 'erc721',
                            log: {
                                address: '0xc2eba41f196c8fb35f60a3a96ae210da8d7f23f6',
                                topics: [
                                    '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef',
                                    '0x0000000000000000000000000000000000000000000000000000000000000000',
                                    '0x0000000000000000000000006532cf5d7acbeebd787381166df4ac782b8abf89',
                                    '0x0000000000000000000000000000000000000000000000000000000000000003',
                                ],
                                data: hexHokenId,
                                blockNumber: '0x23c4852',
                                transactionHash: '0x7433d17e87888faf38bba59626fb4bd80683f55c355f3c485ce90fd0dcc16b4c',
                                transactionIndex: '0x1',
                                blockHash: '0x53d7f7f119511472c5c86e9ec81b7a733df145814045936e6547310cab6d6955',
                                logIndex: '0x0',
                                removed: false,
                            },
                        },
                    ],
                },
            };
            await controller.nftActivity({ body: request });

            const nft = await nftService.getNft({ collection: { id: collection.id }, tokenId: tokenId.toString() });
            expect(nft.collection.id).toEqual(collection.id);
        });

        it('should serialize TRANSFER event', async () => {
            // tier 0
            const tokenId = faker.number.int({ min: 1, max: 100 });
            const hexHokenId = '0x' + tokenId.toString(16);
            const mintRequest = {
                webhookId: 'wh_tconj0eytlvxllux',
                id: 'whevt_bm5nbftkzbkcejmd',
                createdAt: '2023-08-29T09:15:40.651Z',
                type: 'NFT_ACTIVITY',
                event: {
                    network: 'ARB_GOERLI',
                    activity: [
                        {
                            fromAddress: '0x0000000000000000000000000000000000000000',
                            toAddress: '0x6532cf5d7acbeebd787381166df4ac782b888888',
                            contractAddress: collection.tokenAddress,
                            blockNum: '0x23c4852',
                            hash: '0x7433d17e87888faf38bba59626fb4bd80683f55c355f3c485ce90fd0dcc16b4c',
                            erc721TokenId: hexHokenId,
                            category: 'erc721',
                            log: {
                                address: '0xc2eba41f196c8fb35f60a3a96ae210da8d7f23f6',
                                topics: [
                                    '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef',
                                    '0x0000000000000000000000000000000000000000000000000000000000000000',
                                    '0x0000000000000000000000006532cf5d7acbeebd787381166df4ac782b8abf89',
                                    '0x0000000000000000000000000000000000000000000000000000000000000003',
                                ],
                                data: hexHokenId,
                                blockNumber: '0x23c4852',
                                transactionHash: '0x7433d17e87888faf38bba59626fb4bd80683f55c355f3c485ce90fd0dcc16b4c',
                                transactionIndex: '0x1',
                                blockHash: '0x53d7f7f119511472c5c86e9ec81b7a733df145814045936e6547310cab6d6955',
                                logIndex: '0x0',
                                removed: false,
                            },
                        },
                    ],
                },
            };
            await controller.nftActivity({ body: mintRequest });

            const transferRequest = {
                webhookId: 'wh_tconj0eytlvxllux',
                id: 'whevt_bm5nbftkzbkcejmd',
                createdAt: '2023-08-29T09:15:40.651Z',
                type: 'NFT_ACTIVITY',
                event: {
                    network: 'ARB_GOERLI',
                    activity: [
                        {
                            fromAddress: '0x6532cf5d7acbeebd787381166df4ac782b888888',
                            toAddress: '0x6532cf5d7acbeebd787381166df4ac782b888888',
                            contractAddress: collection.tokenAddress,
                            blockNum: '0x23c4852',
                            hash: '0x7433d17e87888faf38bba59626fb4bd80683f55c355f3c485ce90fd0dcc16b4c',
                            erc721TokenId: hexHokenId,
                            category: 'erc721',
                            log: {
                                address: '0xc2eba41f196c8fb35f60a3a96ae210da8d7f23f6',
                                topics: [
                                    '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef',
                                    '0x0000000000000000000000000000000000000000000000000000000000000000',
                                    '0x0000000000000000000000006532cf5d7acbeebd787381166df4ac782b8abf89',
                                    '0x0000000000000000000000000000000000000000000000000000000000000003',
                                ],
                                data: hexHokenId,
                                blockNumber: '0x23c4852',
                                transactionHash: '0x7433d17e87888faf38bba59626fb4bd80683f55c355f3c485ce90fd0dcc16b4c',
                                transactionIndex: '0x1',
                                blockHash: '0x53d7f7f119511472c5c86e9ec81b7a733df145814045936e6547310cab6d6955',
                                logIndex: '0x0',
                                removed: false,
                            },
                        },
                    ],
                },
            };

            await controller.nftActivity({ body: transferRequest });

            const nft = await nftService.getNft({ collection: { id: collection.id }, tokenId: tokenId.toString() });
            expect(nft.collection.id).toEqual(collection.id);
            expect(nft.properties).toBeTruthy();
            expect(nft.properties.level).toBeTruthy();
            expect(nft.properties.holding_days).toBeTruthy();
        });
    });
});
