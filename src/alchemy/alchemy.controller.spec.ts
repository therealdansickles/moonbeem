import { faker } from '@faker-js/faker';

import { CollectionService } from '../collection/collection.service';
import { createCoin, createCollection, createMintSaleContract, createTier } from '../test-utils';

describe('AlchemyController', () => {
    let controller;
    let collectionService: CollectionService;
    let collection;

    beforeAll(async () => {
        controller = global.alchemyController;
        const coinService = global.coinService;
        const coin = await createCoin(coinService);
        collectionService = global.collectionService;
        collection = await createCollection(collectionService, { tokenAddress: faker.finance.ethereumAddress() });
        const mintSaleContractService = global.mintSaleContractService;
        await createMintSaleContract(mintSaleContractService, { collectionId: collection.id, startId: 1, endId: 100, tierId: 0 });
        await createMintSaleContract(mintSaleContractService, { collectionId: collection.id, startId: 101, endId: 200, tierId: 1 });
        const tierService = global.tierService;
        await createTier(tierService, {
            collection: { id: collection.id },
            paymentTokenAddress: coin.address,
            tierId: 0
        });
    });

    describe('nftActivity', () => {
        it('should work if the tier doesn\'t have metadata or metadata.properties', async () => {
            const request = {
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
            const result = await controller.nftActivity({ body: request });
            expect(result.length).toEqual(1);
        });
    });
});
