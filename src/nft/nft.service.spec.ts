import BigNumber from 'bignumber.js';
import { addMinutes } from 'date-fns';
import { sortBy } from 'lodash';
import { Repository } from 'typeorm';

import { faker } from '@faker-js/faker';

import { CollectionService } from '../collection/collection.service';
import {
    createCollection,
    createCollectionPlugin,
    createPlugin2,
    createRecipientsMerkleTree,
    createTier
} from '../test-utils';
import { TierService } from '../tier/tier.service';
import { UserService } from '../user/user.service';
import { WalletService } from '../wallet/wallet.service';
import { Nft } from './nft.entity';
import { NftService } from './nft.service';
import { MerkleTreeService } from '../merkleTree/merkleTree.service';

describe('NftService', () => {
    let nftRepository: Repository<Nft>;
    let nftService: NftService;
    let tierService: TierService;
    let collectionService: CollectionService;
    let userService: UserService;
    let walletService: WalletService;
    let merkleTreeService: MerkleTreeService;

    beforeAll(async () => {
        nftRepository = global.nftRepository;
        nftService = global.nftService;
        userService = global.userService;
        walletService = global.walletService;
        collectionService = global.collectionService;
        tierService = global.tierService;
        merkleTreeService = global.merkleTreeService;
    });

    afterEach(async () => {
        await global.clearDatabase();
        global.gc && global.gc();
    });

    describe('#createOrUpdateNftByTokenId', () => {
        it("should create a nft record if didn't exist", async () => {
            await userService.createUser({
                email: faker.internet.email(),
                password: 'password',
            });

            const wallet = await walletService.createWallet({
                address: faker.finance.ethereumAddress(),
            });

            const collection = await collectionService.createCollection({
                name: faker.company.name(),
                displayName: 'The best collection',
                about: 'The best collection ever',
                address: faker.finance.ethereumAddress(),
                artists: [],
                tags: [],
                creator: { id: wallet.id },
            });

            const tier = await tierService.createTier({
                name: faker.company.name(),
                totalMints: 100,
                collection: { id: collection.id },
                price: '100',
                tierId: 0,
                metadata: {
                    uses: [],
                    properties: {
                        level: {
                            name: 'level',
                            type: 'string',
                            value: 'basic',
                            display_value: 'Basic',
                        },
                        holding_days: {
                            name: 'holding_days',
                            type: 'integer',
                            value: 125,
                            display_value: 'Days of holding',
                        },
                    },
                },
            });

            const result = await nftService.createOrUpdateNftByTokenId({
                collectionId: collection.id,
                tierId: tier.id,
                tokenId: faker.string.numeric({ length: 1, allowLeadingZeros: false }),
                properties: {
                    foo: { value: 'bar' },
                },
                ownerAddress: faker.finance.ethereumAddress(),
            });
            expect(result.id).toBeTruthy();
            expect(result.properties.foo.value).toEqual('bar');
            expect(result.ownerAddress).toBeTruthy();
        });

        it('should update a nft record if already exist', async () => {
            await userService.createUser({
                email: faker.internet.email(),
                password: 'password',
            });

            const wallet = await walletService.createWallet({
                address: faker.finance.ethereumAddress(),
            });

            const collection = await collectionService.createCollection({
                name: faker.company.name(),
                displayName: 'The best collection',
                about: 'The best collection ever',
                address: faker.finance.ethereumAddress(),
                artists: [],
                tags: [],
                creator: { id: wallet.id },
            });

            const tier = await tierService.createTier({
                name: faker.company.name(),
                totalMints: 100,
                collection: { id: collection.id },
                price: '100',
                tierId: 0,
                metadata: {
                    uses: [],
                    properties: {
                        level: {
                            name: 'level',
                            type: 'string',
                            value: 'basic',
                            display_value: 'Basic',
                        },
                        holding_days: {
                            name: 'holding_days',
                            type: 'integer',
                            value: 125,
                            display_value: 'Days of holding',
                        },
                    },
                },
            });

            const tokenId = faker.string.numeric({ length: 1, allowLeadingZeros: false });

            await nftService.createOrUpdateNftByTokenId({
                collectionId: collection.id,
                tierId: tier.id,
                tokenId,
                properties: {
                    foo: { value: 'bar' },
                },
            });

            const result = await nftService.createOrUpdateNftByTokenId({
                collectionId: collection.id,
                tierId: tier.id,
                tokenId,
                properties: {
                    foo: { value: 'barrrrr' },
                },
            });
            expect(result.id).toBeTruthy();
            expect(result.properties.foo.value).toEqual('barrrrr');
        });
    });

    describe('#getNftListByQuery', () => {
        it('should get NFT list by collection and tokenIds', async () => {
            await userService.createUser({
                email: faker.internet.email(),
                password: 'password',
            });

            const wallet = await walletService.createWallet({
                address: faker.finance.ethereumAddress(),
            });

            const collection = await collectionService.createCollection({
                name: faker.company.name(),
                displayName: 'The best collection',
                about: 'The best collection ever',
                address: faker.finance.ethereumAddress(),
                artists: [],
                tags: [],
                creator: { id: wallet.id },
            });

            const anotherCollection = await collectionService.createCollection({
                name: faker.company.name(),
                displayName: 'The best collection',
                about: 'The best collection ever',
                address: faker.finance.ethereumAddress(),
                artists: [],
                tags: [],
                creator: { id: wallet.id },
            });

            const tier = await tierService.createTier({
                name: faker.company.name(),
                totalMints: 100,
                collection: { id: collection.id },
                price: '100',
                tierId: 0,
                metadata: {
                    uses: [],
                    properties: {
                        level: {
                            name: 'level',
                            type: 'string',
                            value: 'basic',
                            display_value: 'Basic',
                        },
                        holding_days: {
                            name: 'holding_days',
                            type: 'integer',
                            value: 125,
                            display_value: 'none',
                        },
                    },
                },
            });

            const anotherTier = await tierService.createTier({
                name: faker.company.name(),
                totalMints: 100,
                collection: { id: anotherCollection.id },
                price: '100',
                tierId: 0,
                metadata: {
                    uses: [],
                    properties: {
                        level: {
                            name: 'level',
                            type: 'string',
                            value: 'basic',
                            display_value: 'Basic',
                        },
                        holding_days: {
                            name: 'holding_days',
                            type: 'integer',
                            value: 125,
                            display_value: 'none',
                        },
                    },
                },
            });

            const tokenId1 = faker.string.numeric({ length: 1, allowLeadingZeros: false });
            const tokenId2 = faker.string.numeric({ length: 2, allowLeadingZeros: false });
            const tokenId3 = faker.string.numeric({ length: 4, allowLeadingZeros: false });

            const [nft1, ,] = await Promise.all([
                nftService.createOrUpdateNftByTokenId({
                    collectionId: collection.id,
                    tierId: tier.id,
                    tokenId: tokenId1,
                    properties: {
                        foo: { value: 'bar' },
                    },
                }),
                nftService.createOrUpdateNftByTokenId({
                    collectionId: collection.id,
                    tierId: tier.id,
                    tokenId: tokenId2,
                    properties: {
                        foo: { value: 'bar' },
                    },
                }),
                nftService.createOrUpdateNftByTokenId({
                    collectionId: anotherCollection.id,
                    tierId: anotherTier.id,
                    tokenId: tokenId3,
                    properties: {
                        foo: { value: 'bar' },
                    },
                }),
            ]);

            const result = await nftService.getNfts({
                collection: { id: collection.id },
                tokenIds: [tokenId1, tokenId3],
            });
            result.sort((a, b) => +a.tokenId - +b.tokenId); // Sort first, otherwise there may be an order error
            expect(result.length).toEqual(1);
            expect(result[0].id).toEqual(nft1.id);
        });

        it('should get NFT list by collection and tokenIds', async () => {
            await userService.createUser({
                email: faker.internet.email(),
                password: 'password',
            });

            const wallet = await walletService.createWallet({
                address: faker.finance.ethereumAddress(),
            });

            const collection = await collectionService.createCollection({
                name: faker.company.name(),
                displayName: 'The best collection',
                about: 'The best collection ever',
                address: faker.finance.ethereumAddress(),
                artists: [],
                tags: [],
                creator: { id: wallet.id },
            });

            const tier = await tierService.createTier({
                name: faker.company.name(),
                totalMints: 100,
                collection: { id: collection.id },
                price: '100',
                tierId: 0,
                metadata: {
                    uses: [],
                    properties: {
                        level: {
                            name: 'level',
                            type: 'string',
                            value: 'basic',
                            display_value: 'Basic',
                        },
                        holding_days: {
                            name: 'holding_days',
                            type: 'integer',
                            value: 125,
                            display_value: 'none',
                        },
                    },
                },
            });

            const tokenId1 = faker.string.numeric({ length: 1, allowLeadingZeros: false });
            const tokenId2 = faker.string.numeric({ length: 2, allowLeadingZeros: false });
            const tokenId3 = faker.string.numeric({ length: 4, allowLeadingZeros: false });

            const [nft1, , nft3] = await Promise.all([
                nftService.createOrUpdateNftByTokenId({
                    collectionId: collection.id,
                    tierId: tier.id,
                    tokenId: tokenId1,
                    properties: {
                        foo: { value: 'bar' },
                    },
                }),
                nftService.createOrUpdateNftByTokenId({
                    collectionId: collection.id,
                    tierId: tier.id,
                    tokenId: tokenId2,
                    properties: {
                        foo: { value: 'bar' },
                    },
                }),
                nftService.createOrUpdateNftByTokenId({
                    collectionId: collection.id,
                    tierId: tier.id,
                    tokenId: tokenId3,
                    properties: {
                        foo: { value: 'bar' },
                    },
                }),
            ]);

            const result = await nftService.getNfts({
                collection: { id: collection.id },
                tokenIds: [tokenId1, tokenId3],
            });
            result.sort((a, b) => +a.tokenId - +b.tokenId); // Sort first, otherwise there may be an order error
            expect(result.length).toEqual(2);
            expect(result[0].id).toEqual(nft1.id);
            expect(result[1].id).toEqual(nft3.id);
        });

        it('should get NFT list by collection and properties', async () => {
            await userService.createUser({
                email: faker.internet.email(),
                password: 'password',
            });

            const wallet = await walletService.createWallet({
                address: faker.finance.ethereumAddress(),
            });

            const collection = await collectionService.createCollection({
                name: faker.company.name(),
                displayName: 'The best collection',
                about: 'The best collection ever',
                address: faker.finance.ethereumAddress(),
                artists: [],
                tags: [],
                creator: { id: wallet.id },
            });

            const tier = await tierService.createTier({
                name: faker.company.name(),
                totalMints: 100,
                collection: { id: collection.id },
                price: '100',
                tierId: 0,
                metadata: {
                    uses: [],
                    properties: {
                        level: {
                            name: 'level',
                            type: 'string',
                            value: 'basic',
                            display_value: 'Basic',
                        },
                        holding_days: {
                            name: 'holding_days',
                            type: 'integer',
                            value: 125,
                            display_value: 'none',
                        },
                    },
                },
            });

            const tokenId1 = faker.string.numeric({ length: 1, allowLeadingZeros: false });
            const tokenId2 = faker.string.numeric({ length: 2, allowLeadingZeros: false });
            const tokenId3 = faker.string.numeric({ length: 4, allowLeadingZeros: false });

            const [, , nft3] = await Promise.all([
                nftService.createOrUpdateNftByTokenId({
                    collectionId: collection.id,
                    tierId: tier.id,
                    tokenId: tokenId1,
                    properties: {
                        foo: {
                            name: 'foo',
                            value: 'foo0',
                        },
                        bar: {
                            name: 'bar',
                            value: 'bar0',
                        },
                    },
                }),
                nftService.createOrUpdateNftByTokenId({
                    collectionId: collection.id,
                    tierId: tier.id,
                    tokenId: tokenId2,
                    properties: {
                        foo: {
                            name: 'foo',
                            value: 'foo1',
                        },
                        bar: {
                            name: 'bar',
                            value: 'bar1',
                        },
                    },
                }),
                nftService.createOrUpdateNftByTokenId({
                    collectionId: collection.id,
                    tierId: tier.id,
                    tokenId: tokenId3,
                    properties: {
                        foo: {
                            name: 'foo',
                            value: 'foo2',
                        },
                        bar: {
                            name: 'bar',
                            value: 'bar2',
                        },
                    },
                }),
            ]);

            const result = await nftService.getNfts({
                collection: { id: collection.id },
                tokenIds: [tokenId1, tokenId3],
                properties: [
                    { name: 'foo', value: 'foo2' },
                    { name: 'bar', value: 'bar2' },
                ],
            });
            expect(result.length).toEqual(1);
            expect(result[0].id).toEqual(nft3.id);
        });

        it('should get NFT list by collection and dynamic properties using min and max', async () => {
            await userService.createUser({
                email: faker.internet.email(),
                password: 'password',
            });

            const wallet = await walletService.createWallet({
                address: faker.finance.ethereumAddress(),
            });

            const collection = await createCollection(collectionService, {
                creator: { id: wallet.id },
            });

            const tier = await createTier(tierService, {
                collection: { id: collection.id },
            });

            const tokenId1 = faker.string.numeric({ length: 1, allowLeadingZeros: false });
            const tokenId2 = faker.string.numeric({ length: 2, allowLeadingZeros: false });
            const tokenId3 = faker.string.numeric({ length: 4, allowLeadingZeros: false });

            const [, nft2, nft3] = await Promise.all([
                nftService.createOrUpdateNftByTokenId({
                    collectionId: collection.id,
                    tierId: tier.id,
                    tokenId: tokenId1,
                    properties: {
                        level: {
                            name: 'level',
                            value: '10',
                        },
                    },
                }),
                nftService.createOrUpdateNftByTokenId({
                    collectionId: collection.id,
                    tierId: tier.id,
                    tokenId: tokenId2,
                    properties: {
                        level: {
                            name: 'level',
                            value: '30',
                        },
                    },
                }),
                nftService.createOrUpdateNftByTokenId({
                    collectionId: collection.id,
                    tierId: tier.id,
                    tokenId: tokenId3,
                    properties: {
                        level: {
                            name: 'level',
                            value: '50',
                        },
                    },
                }),
            ]);

            const result = await nftService.getNfts({
                collection: { id: collection.id },
                tokenIds: [tokenId1, tokenId2, tokenId3],
                properties: [{ name: 'level', min: 20, max: 50 }],
            });
            expect(result.length).toEqual(2);
            expect(result.map((nft) => nft.id)).toEqual(expect.arrayContaining([nft2.id, nft3.id]));
        });

        it('should get NFT list by collection and plugins', async () => {
            await userService.createUser({
                email: faker.internet.email(),
                password: 'password',
            });

            const wallet = await walletService.createWallet({
                address: faker.finance.ethereumAddress(),
            });

            const collection = await createCollection(collectionService, {
                creator: { id: wallet.id },
            });

            const plugins = ['pluginA', 'pluginB'];

            const tier = await createTier(tierService, {
                collection: { id: collection.id },
            });

            await Promise.all([
                nftService.createOrUpdateNftByTokenId({
                    collectionId: collection.id,
                    tierId: tier.id,
                    tokenId: '2',
                    properties: {},
                }),
                nftService.createOrUpdateNftByTokenId({
                    collectionId: collection.id,
                    tierId: tier.id,
                    tokenId: '3',
                    properties: {},
                }),
                nftService.createOrUpdateNftByTokenId({
                    collectionId: collection.id,
                    tierId: tier.id,
                    tokenId: '4',
                    properties: {},
                }),
                nftService.createOrUpdateNftByTokenId({
                    collectionId: collection.id,
                    tierId: tier.id,
                    tokenId: '5',
                    properties: {},
                }),
            ]);

            const merkleTree1 = await createRecipientsMerkleTree(
                merkleTreeService, collection.address, [1, 2, 3, 4]);
            const merkleTree2 = await createRecipientsMerkleTree(
                merkleTreeService, collection.address, [3, 4, 5, 6]);
            const plugin1 = await createPlugin2();
            await createCollectionPlugin(
                collection.id,
                plugin1.id,
                {
                    name: plugins[0],
                    merkleRoot: merkleTree1.merkleRoot,
                }
            );
            const pluginB = await createPlugin2({ name: plugins[1] });
            await createCollectionPlugin(
                collection.id,
                pluginB.id,
                {
                    name: plugins[1],
                    merkleRoot: merkleTree2.merkleRoot,
                }
            );

            const result = await nftService.getNfts({
                collection: { id: collection.id },
                tokenIds: ['2', '3', '4', '5'],
                plugins
            });
            expect(result.length).toEqual(2);
            expect(result.map((nft) => nft.tokenId)).toEqual(expect.arrayContaining(['3', '4']));
        });
    });

    describe('#getNftWithProperty', () => {
        it('should return NFTs with specific property', async () => {
            await userService.createUser({
                email: faker.internet.email(),
                password: 'password',
            });

            const wallet = await walletService.createWallet({
                address: faker.finance.ethereumAddress(),
            });

            const collection = await collectionService.createCollection({
                name: faker.company.name(),
                displayName: 'The best collection',
                about: 'The best collection ever',
                address: faker.finance.ethereumAddress(),
                artists: [],
                tags: [],
                creator: { id: wallet.id },
            });

            const tier = await tierService.createTier({
                name: faker.company.name(),
                totalMints: 100,
                collection: { id: collection.id },
                price: '100',
                tierId: 0,
                metadata: {
                    uses: [],
                    properties: {
                        level: {
                            name: '{{level}}',
                            type: 'string',
                            value: 'basic',
                            display_value: 'Basic',
                        },
                        holding_days: {
                            name: '{{holding_days}}',
                            type: 'number',
                            value: '125',
                            display_value: 'none',
                        },
                    },
                },
            });

            const tokenId1 = faker.string.numeric({ length: 1, allowLeadingZeros: false });
            const tokenId2 = faker.string.numeric({ length: 2, allowLeadingZeros: false });
            const tokenId3 = faker.string.numeric({ length: 4, allowLeadingZeros: false });
            const tokenId4 = faker.string.numeric({ length: 5, allowLeadingZeros: false });

            const [nft1, , nft3, nft4] = await Promise.all([
                nftService.createOrUpdateNftByTokenId({
                    collectionId: collection.id,
                    tierId: tier.id,
                    tokenId: tokenId1,
                    properties: {
                        foo: {
                            name: '{{foo}}',
                            value: '9',
                        },
                    },
                }),
                nftService.createOrUpdateNftByTokenId({
                    collectionId: collection.id,
                    tierId: tier.id,
                    tokenId: tokenId2,
                    properties: {
                        bar: {
                            name: '{{bar}}',
                            value: faker.string.numeric({ allowLeadingZeros: false }),
                        },
                    },
                }),
                nftService.createOrUpdateNftByTokenId({
                    collectionId: collection.id,
                    tierId: tier.id,
                    tokenId: tokenId3,
                    properties: {
                        foo: {
                            name: '{{foo}}',
                            value: '100',
                        },
                        bar: {
                            name: '{{bar}}',
                            value: faker.string.numeric({ allowLeadingZeros: false }),
                        },
                    },
                }),
                nftService.createOrUpdateNftByTokenId({
                    collectionId: collection.id,
                    tierId: tier.id,
                    tokenId: tokenId4,
                    properties: {},
                }),
            ]);
            await nftService.createOrUpdateNftByTokenId({
                collectionId: collection.id,
                tierId: tier.id,
                tokenId: tokenId4,
                properties: {
                    foo: {
                        name: '{{foo}}',
                        value: 'N/A',
                    },
                },
            });
            await nftService.createOrUpdateNftByTokenId({
                collectionId: faker.string.uuid(),
                tierId: tier.id,
                tokenId: tokenId4,
                properties: {},
            });

            const result = await nftService.getNftByProperty({
                collection: { id: collection.id },
                propertyName: 'foo',
            });
            expect(result.length).toEqual(3);
            expect(result[0].tokenId).toEqual(nft3.tokenId);
            expect(result[0].collection.id).toEqual(collection.id);
            expect(result[0].tier.id).toEqual(tier.id);
            expect(result[1].tokenId).toEqual(nft1.tokenId);
            expect(result[1].collection.id).toEqual(collection.id);
            expect(result[1].tier.id).toEqual(tier.id);
            expect(result[2].tokenId).toEqual(nft4.tokenId);
            expect(result[2].collection.id).toEqual(collection.id);
            expect(result[2].tier.id).toEqual(tier.id);
        });
    });

    describe('#getOverviewByCollectionAndProperty', () => {
        it('should return NFTs with specific property', async () => {
            await userService.createUser({
                email: faker.internet.email(),
                password: 'password',
            });

            const wallet = await walletService.createWallet({
                address: faker.finance.ethereumAddress(),
            });

            const collection = await collectionService.createCollection({
                name: faker.company.name(),
                displayName: 'The best collection',
                about: 'The best collection ever',
                address: faker.finance.ethereumAddress(),
                artists: [],
                tags: [],
                creator: { id: wallet.id },
            });

            const tier = await tierService.createTier({
                name: faker.company.name(),
                totalMints: 100,
                collection: { id: collection.id },
                price: '100',
                tierId: 0,
                metadata: {
                    uses: [],
                    properties: {
                        level: {
                            name: '{{level}}',
                            type: 'string',
                            value: 'basic',
                            display_value: 'Basic',
                        },
                        holding_days: {
                            name: '{{holding_days}}',
                            type: 'number',
                            value: '125',
                            display_value: 'none',
                        },
                    },
                },
            });

            const tokenId1 = faker.string.numeric({ length: 1, allowLeadingZeros: false });
            const tokenId2 = faker.string.numeric({ length: 2, allowLeadingZeros: false });
            const tokenId3 = faker.string.numeric({ length: 4, allowLeadingZeros: false });
            const tokenId4 = faker.string.numeric({ length: 5, allowLeadingZeros: false });

            const [nft1, , nft3] = await Promise.all([
                nftService.createOrUpdateNftByTokenId({
                    collectionId: collection.id,
                    tierId: tier.id,
                    tokenId: tokenId1,
                    properties: {
                        foo: {
                            name: '{{foo}}',
                            value: faker.string.numeric({ length: 4, allowLeadingZeros: false }),
                        },
                    },
                }),
                nftService.createOrUpdateNftByTokenId({
                    collectionId: collection.id,
                    tierId: tier.id,
                    tokenId: tokenId2,
                    properties: {
                        bar: {
                            name: '{{bar}}',
                            value: faker.string.numeric({ allowLeadingZeros: false }),
                        },
                    },
                }),
                nftService.createOrUpdateNftByTokenId({
                    collectionId: collection.id,
                    tierId: tier.id,
                    tokenId: tokenId3,
                    properties: {
                        foo: {
                            name: '{{foo}}',
                            value: faker.string.numeric({ length: 2, allowLeadingZeros: false }),
                        },
                        bar: {
                            name: '{{bar}}',
                            value: faker.string.numeric({ allowLeadingZeros: false }),
                        },
                    },
                }),
                nftService.createOrUpdateNftByTokenId({
                    collectionId: collection.id,
                    tierId: tier.id,
                    tokenId: tokenId4,
                    properties: {},
                }),
                nftService.createOrUpdateNftByTokenId({
                    collectionId: faker.string.uuid(),
                    tierId: tier.id,
                    tokenId: tokenId4,
                    properties: {
                        foo: {
                            name: '{{foo}}',
                            value: faker.string.numeric({ allowLeadingZeros: false }),
                        },
                        bar: {
                            name: '{{bar}}',
                            value: faker.string.numeric({ allowLeadingZeros: false }),
                        },
                    },
                }),
            ]);

            const { max, min, avg } = await nftService.getOverviewByCollectionAndProperty({
                collection: { id: collection.id },
                propertyName: 'foo',
            });
            expect(max.toString()).toEqual(nft1.properties.foo.value);
            expect(min.toString()).toEqual(nft3.properties.foo.value);
            expect(avg.toString()).toEqual(BigNumber(nft1.properties.foo.value).plus(nft3.properties.foo.value).dividedBy(2).toFixed(2).toString());
        });
    });

    describe('#getNft', () => {
        it('should get record by id', async () => {
            await userService.createUser({
                email: faker.internet.email(),
                password: 'password',
            });

            const wallet = await walletService.createWallet({
                address: faker.finance.ethereumAddress(),
            });

            const collection = await collectionService.createCollection({
                name: faker.company.name(),
                displayName: 'The best collection',
                about: 'The best collection ever',
                address: faker.finance.ethereumAddress(),
                artists: [],
                tags: [],
                creator: { id: wallet.id },
            });

            const tier = await tierService.createTier({
                name: faker.company.name(),
                totalMints: 100,
                collection: { id: collection.id },
                price: '100',
                tierId: 0,
                metadata: {
                    uses: [],
                    properties: {
                        level: {
                            name: 'level',
                            type: 'string',
                            value: 'basic',
                            display_value: 'Basic',
                        },
                        holding_days: {
                            name: 'holding_days',
                            type: 'integer',
                            value: 125,
                            display_value: 'Days of holding',
                        },
                    },
                },
            });

            const tokenId = faker.string.numeric({ length: 1, allowLeadingZeros: false });

            const nft = await nftService.createOrUpdateNftByTokenId({
                collectionId: collection.id,
                tierId: tier.id,
                tokenId,
                properties: {
                    foo: { value: 'bar' },
                },
            });

            const result = await nftService.getNft({
                id: nft.id,
            });
            expect(result.collection.id).toEqual(nft.collection.id);
        });

        it('should get record by collectionId and tokenId', async () => {
            await userService.createUser({
                email: faker.internet.email(),
                password: 'password',
            });

            const wallet = await walletService.createWallet({
                address: faker.finance.ethereumAddress(),
            });

            const collection = await collectionService.createCollection({
                name: faker.company.name(),
                displayName: 'The best collection',
                about: 'The best collection ever',
                address: faker.finance.ethereumAddress(),
                artists: [],
                tags: [],
                creator: { id: wallet.id },
            });

            const tier = await tierService.createTier({
                name: faker.company.name(),
                totalMints: 100,
                collection: { id: collection.id },
                price: '100',
                // paymentTokenAddress: coin.address,
                tierId: 0,
                metadata: {
                    uses: [],
                    properties: {
                        level: {
                            name: 'level',
                            type: 'string',
                            value: 'basic',
                            display_value: 'Basic',
                        },
                        holding_days: {
                            name: 'holding_days',
                            type: 'integer',
                            value: 125,
                            display_value: 'Days of holding',
                        },
                    },
                },
            });

            const tokenId = faker.string.numeric({ length: 1, allowLeadingZeros: false });

            const nft = await nftService.createOrUpdateNftByTokenId({
                collectionId: collection.id,
                tierId: tier.id,
                tokenId,
                properties: {
                    foo: { value: 'bar' },
                },
            });

            const result = await nftService.getNft({
                collection: { id: collection.id },
                tokenId,
            });
            expect(result.id).toEqual(nft.id);
        });
    });

    describe('#getNfts', () => {
        it('should get record by collection id', async () => {
            await userService.createUser({
                email: faker.internet.email(),
                password: 'password',
            });

            const wallet = await walletService.createWallet({
                address: faker.finance.ethereumAddress(),
            });

            const collection = await collectionService.createCollection({
                name: faker.company.name(),
                displayName: 'The best collection',
                about: 'The best collection ever',
                address: faker.finance.ethereumAddress(),
                artists: [],
                tags: [],
                creator: { id: wallet.id },
            });

            const tier = await tierService.createTier({
                name: faker.company.name(),
                totalMints: 100,
                collection: { id: collection.id },
                price: '100',
                tierId: 0,
                metadata: {
                    uses: [],
                    properties: {
                        level: {
                            name: 'level',
                            type: 'string',
                            value: 'basic',
                            display_value: 'Basic',
                        },
                        holding_days: {
                            name: 'holding_days',
                            type: 'integer',
                            value: 125,
                            display_value: 'Days of holding',
                        },
                    },
                },
            });

            const tokenId = faker.string.numeric({ length: 1, allowLeadingZeros: false });

            await nftService.createOrUpdateNftByTokenId({
                collectionId: collection.id,
                tierId: tier.id,
                tokenId,
                properties: {
                    foo: { value: 'bar' },
                },
            });

            const anotherTokenId = faker.string.numeric({ length: 2, allowLeadingZeros: false });
            await nftService.createOrUpdateNftByTokenId({
                collectionId: collection.id,
                tierId: tier.id,
                tokenId: anotherTokenId,
                properties: {
                    foo: { value: 'bar' },
                },
            });

            const result = await nftService.getNfts({
                collection: { id: collection.id },
            });
            expect(result.length).toEqual(2);
            expect(
                sortBy(
                    result.map((item) => item.tokenId),
                    (item) => +item,
                ),
            ).toEqual([tokenId, anotherTokenId]);
        });

        it('should get record by collectionId and tokenIds', async () => {
            await userService.createUser({
                email: faker.internet.email(),
                password: 'password',
            });

            const wallet = await walletService.createWallet({
                address: faker.finance.ethereumAddress(),
            });

            const collection = await collectionService.createCollection({
                name: faker.company.name(),
                displayName: 'The best collection',
                about: 'The best collection ever',
                address: faker.finance.ethereumAddress(),
                artists: [],
                tags: [],
                creator: { id: wallet.id },
            });

            const tier = await tierService.createTier({
                name: faker.company.name(),
                totalMints: 100,
                collection: { id: collection.id },
                price: '100',
                // paymentTokenAddress: coin.address,
                tierId: 0,
                metadata: {
                    uses: [],
                    properties: {
                        level: {
                            name: '{{level_name}}',
                            type: 'string',
                            value: '{{level}}',
                            display_value: 'Basic',
                        },
                        holding_days: {
                            name: 'holding_days',
                            type: 'integer',
                            value: 125,
                            display_value: 'none',
                        },
                    },
                },
            });

            const tokenId = faker.string.numeric({ length: 1, allowLeadingZeros: false });

            await nftService.createOrUpdateNftByTokenId({
                collectionId: collection.id,
                tierId: tier.id,
                tokenId,
                properties: {
                    foo: { value: 'bar' },
                },
            });

            const anotherTokenId = faker.string.numeric({ length: 2, allowLeadingZeros: false });
            const anotherNft = await nftService.createOrUpdateNftByTokenId({
                collectionId: collection.id,
                tierId: tier.id,
                tokenId: anotherTokenId,
                properties: {
                    foo: { value: 'bar' },
                },
            });

            const result = await nftService.getNfts({
                collection: { id: collection.id },
                tokenIds: [anotherTokenId],
            });
            expect(result.length).toEqual(1);
            expect(result[0].tokenId).toEqual(anotherTokenId);
            expect(result[0].id).toEqual(anotherNft.id);
        });

        it('should get record with metadata', async () => {
            await userService.createUser({
                email: faker.internet.email(),
                password: 'password',
            });

            const wallet = await walletService.createWallet({
                address: faker.finance.ethereumAddress(),
            });

            const collection = await collectionService.createCollection({
                name: faker.company.name(),
                displayName: 'The best collection',
                about: 'The best collection ever',
                address: faker.finance.ethereumAddress(),
                artists: [],
                tags: [],
                creator: { id: wallet.id },
            });

            const tier = await tierService.createTier({
                name: faker.company.name(),
                totalMints: 100,
                collection: { id: collection.id },
                price: '100',
                tierId: 0,
                metadata: {
                    uses: [],
                    properties: {
                        level: {
                            name: '{{level_name}}',
                            type: 'string',
                            value: '{{level}}',
                            display_value: 'Basic',
                        },
                        holding_days: {
                            name: 'holding_days',
                            type: 'integer',
                            value: 125,
                            display_value: 'none',
                        },
                    },
                },
            });

            const tokenId = faker.string.numeric({ length: 1, allowLeadingZeros: false });

            const nft = await nftService.createOrUpdateNftByTokenId({
                collectionId: collection.id,
                tierId: tier.id,
                tokenId,
                properties: {
                    level: {
                        value: faker.lorem.word(5),
                    },
                },
            });

            const result = await nftService.getNfts({
                collection: { id: collection.id },
            });
            expect(result.length).toEqual(1);
            expect(result[0].metadata).toBeTruthy();
            expect(Object.entries(result[0].metadata.properties).find((property) => property[0] === 'level')[1].value).toEqual(
                nft.properties['level'].value,
            );
        });
    });

    describe('#renderMetadata', () => {
        it('should render the NFT record by `tier.metadata` as template', async () => {
            await userService.createUser({
                email: faker.internet.email(),
                password: 'password',
            });

            const wallet = await walletService.createWallet({
                address: faker.finance.ethereumAddress(),
            });

            const collection = await collectionService.createCollection({
                name: faker.company.name(),
                displayName: 'The best collection',
                about: 'The best collection ever',
                address: faker.finance.ethereumAddress(),
                artists: [],
                tags: [],
                creator: { id: wallet.id },
            });

            const tier = await tierService.createTier({
                name: faker.company.name(),
                totalMints: 100,
                collection: { id: collection.id },
                price: '100',
                tierId: 0,
                metadata: {
                    uses: [],
                    properties: {
                        level: {
                            name: 'level',
                            type: 'string',
                            value: '{{level}}',
                            display_value: 'Basic',
                        },
                        holding_days: {
                            name: 'holding_days',
                            type: 'integer',
                            value: '{{holding_days}}',
                            display_value: 'Days of holding',
                        },
                    },
                },
            });

            const tokenId = faker.string.numeric({ length: 1, allowLeadingZeros: false });

            const nft = await nftService.createOrUpdateNftByTokenId({
                collectionId: collection.id,
                tierId: tier.id,
                tokenId,
                properties: {
                    level: { value: '1' },
                    holding_days: { value: 10 },
                },
            });

            const nftInfo = await nftRepository.findOne({ where: { id: nft.id }, relations: ['tier'] });

            const result = await nftService.renderMetadata(nftInfo);
            const renderedProperties = result.metadata.properties;
            expect(renderedProperties['level'].value).toEqual('1');
            expect(renderedProperties['holding_days'].value).toEqual('10');
        });

        it("should render a empty string if there's some properties not provided", async () => {
            await userService.createUser({
                email: faker.internet.email(),
                password: 'password',
            });

            const wallet = await walletService.createWallet({
                address: faker.finance.ethereumAddress(),
            });

            const collection = await collectionService.createCollection({
                name: faker.company.name(),
                displayName: 'The best collection',
                about: 'The best collection ever',
                address: faker.finance.ethereumAddress(),
                artists: [],
                tags: [],
                creator: { id: wallet.id },
            });

            const tier = await tierService.createTier({
                name: faker.company.name(),
                totalMints: 100,
                collection: { id: collection.id },
                price: '100',
                tierId: 0,
                metadata: {
                    uses: [],
                    properties: {
                        level: {
                            name: 'level',
                            type: 'string',
                            value: '{{level}}',
                            display_value: 'Basic',
                        },
                        holding_days: {
                            name: 'holding_days',
                            type: 'integer',
                            value: '{{holding_days}}',
                            display_value: 'Days of holding',
                        },
                        holding_months: {
                            name: 'holding_months',
                            type: 'integer',
                            value: '{{holding_months}}',
                            display_value: 'Months of holding',
                        },
                    },
                },
            });

            const tokenId = faker.string.numeric({ length: 1, allowLeadingZeros: false });

            const nft = await nftService.createOrUpdateNftByTokenId({
                collectionId: collection.id,
                tierId: tier.id,
                tokenId,
                properties: {
                    level: { value: '1' },
                    holding_days: { value: 10 },
                },
            });

            const nftInfo = await nftRepository.findOne({ where: { id: nft.id }, relations: ['tier'] });

            const result = await nftService.renderMetadata(nftInfo);
            const renderedProperties = result.metadata.properties;
            expect(renderedProperties['holding_months'].value).toEqual('');
        });

        it("should won't throw an error if the tier's metadata is not in Mustache format", async () => {
            await userService.createUser({
                email: faker.internet.email(),
                password: 'password',
            });

            const wallet = await walletService.createWallet({
                address: faker.finance.ethereumAddress(),
            });

            const collection = await collectionService.createCollection({
                name: faker.company.name(),
                displayName: 'The best collection',
                about: 'The best collection ever',
                address: faker.finance.ethereumAddress(),
                artists: [],
                tags: [],
                creator: { id: wallet.id },
            });

            const tier = await tierService.createTier({
                name: faker.company.name(),
                totalMints: 100,
                collection: { id: collection.id },
                price: '100',
                tierId: 0,
                metadata: {
                    uses: [],
                    properties: {
                        level: {
                            name: 'level',
                            type: 'string',
                            value: '1',
                            display_value: 'Basic',
                        },
                        holding_days: {
                            name: 'holding_days',
                            type: 'integer',
                            value: '10',
                            display_value: 'Days of holding',
                        },
                    },
                },
            });

            const tokenId = faker.string.numeric({ length: 1, allowLeadingZeros: false });

            const nft = await nftService.createOrUpdateNftByTokenId({
                collectionId: collection.id,
                tierId: tier.id,
                tokenId,
                properties: {
                    level: { value: '1' },
                    holding_days: { value: 10 },
                },
            });

            const nftInfo = await nftRepository.findOne({ where: { id: nft.id }, relations: ['tier'] });

            const result = await nftService.renderMetadata(nftInfo);
            const renderedProperties = result.metadata.properties;
            expect(renderedProperties['level'].value).toEqual('1');
            expect(renderedProperties['holding_days'].value).toEqual('10');
        });

        it('should render `name` as expected', async () => {
            await userService.createUser({
                email: faker.internet.email(),
                password: 'password',
            });

            const wallet = await walletService.createWallet({
                address: faker.finance.ethereumAddress(),
            });

            const collection = await collectionService.createCollection({
                name: faker.company.name(),
                displayName: 'The best collection',
                about: 'The best collection ever',
                address: faker.finance.ethereumAddress(),
                artists: [],
                tags: [],
                creator: { id: wallet.id },
            });

            const tier = await tierService.createTier({
                name: faker.company.name(),
                totalMints: 100,
                collection: { id: collection.id },
                price: '100',
                tierId: 0,
                metadata: {
                    uses: [],
                    properties: {
                        level: {
                            name: '{{level_name}}',
                            type: 'string',
                            value: '{{level}}',
                            display_value: 'Basic',
                        },
                        holding_days: {
                            name: '{{holding_days_name}}',
                            type: 'integer',
                            value: '{{holding_days}}',
                            display_value: 'Days of holding',
                        },
                    },
                    configs: {
                        alias: {
                            level_name: 'real_level_name',
                        },
                    },
                },
            });

            const tokenId = faker.string.numeric({ length: 1, allowLeadingZeros: false });

            const nft = await nftService.createOrUpdateNftByTokenId({
                collectionId: collection.id,
                tierId: tier.id,
                tokenId,
                properties: {
                    level: { value: '1' },
                    holding_days: { value: 10 },
                },
            });

            const nftInfo = await nftRepository.findOne({ where: { id: nft.id }, relations: ['tier'] });

            const result = await nftService.renderMetadata(nftInfo);
            const renderedProperties = result.metadata.properties;
            expect(renderedProperties['level'].value).toEqual('1');
            expect(renderedProperties['level'].name).toEqual('real_level_name');
            expect(renderedProperties['holding_days'].value).toEqual('10');
            expect(renderedProperties['holding_days'].name).toEqual('holding_days');
        });

        it('should render `image` if image property existed on NFT', async () => {
            await userService.createUser({
                email: faker.internet.email(),
                password: 'password',
            });

            const wallet = await walletService.createWallet({
                address: faker.finance.ethereumAddress(),
            });

            const collection = await collectionService.createCollection({
                name: faker.company.name(),
                displayName: 'The best collection',
                about: 'The best collection ever',
                address: faker.finance.ethereumAddress(),
                artists: [],
                tags: [],
                creator: { id: wallet.id },
            });

            const tier = await tierService.createTier({
                name: faker.company.name(),
                totalMints: 100,
                collection: { id: collection.id },
                price: '100',
                tierId: 0,
                metadata: {
                    uses: [],
                    image: faker.image.url(),
                    properties: {
                        level: {
                            name: '{{level_name}}',
                            type: 'string',
                            value: '{{level}}',
                            display_value: 'Basic',
                        },
                        holding_days: {
                            name: '{{holding_days_name}}',
                            type: 'integer',
                            value: '{{holding_days}}',
                            display_value: 'Days of holding',
                        },
                    },
                    configs: {
                        alias: {
                            level_name: 'real_level_name',
                        },
                    },
                },
            });

            const tokenId = faker.string.numeric({ length: 1, allowLeadingZeros: false });

            const nft = await nftService.createOrUpdateNftByTokenId({
                collectionId: collection.id,
                tierId: tier.id,
                tokenId,
                properties: {
                    image: { value: faker.image.url() },
                    level: { value: '1' },
                    holding_days: { value: 10 },
                },
            });

            const nftInfo = await nftRepository.findOne({ where: { id: nft.id }, relations: ['tier'] });

            const result = await nftService.renderMetadata(nftInfo);
            expect(result.metadata.image).toEqual(nft.properties.image.value);
        });

        it("should render `image` if image property doesn't exist on NFT", async () => {
            await userService.createUser({
                email: faker.internet.email(),
                password: 'password',
            });

            const wallet = await walletService.createWallet({
                address: faker.finance.ethereumAddress(),
            });

            const collection = await collectionService.createCollection({
                name: faker.company.name(),
                displayName: 'The best collection',
                about: 'The best collection ever',
                address: faker.finance.ethereumAddress(),
                artists: [],
                tags: [],
                creator: { id: wallet.id },
            });

            const tier = await tierService.createTier({
                name: faker.company.name(),
                totalMints: 100,
                collection: { id: collection.id },
                price: '100',
                tierId: 0,
                metadata: {
                    uses: [],
                    image: faker.image.url(),
                    properties: {
                        level: {
                            name: '{{level_name}}',
                            type: 'string',
                            value: '{{level}}',
                            display_value: 'Basic',
                        },
                        holding_days: {
                            name: '{{holding_days_name}}',
                            type: 'integer',
                            value: '{{holding_days}}',
                            display_value: 'Days of holding',
                        },
                    },
                    configs: {
                        alias: {
                            level_name: 'real_level_name',
                        },
                    },
                },
            });

            const tokenId = faker.string.numeric({ length: 1, allowLeadingZeros: false });

            const nft = await nftService.createOrUpdateNftByTokenId({
                collectionId: collection.id,
                tierId: tier.id,
                tokenId,
                properties: {
                    level: { value: '1' },
                    holding_days: { value: 10 },
                },
            });

            const nftInfo = await nftRepository.findOne({ where: { id: nft.id }, relations: ['tier'] });

            const result = await nftService.renderMetadata(nftInfo);
            expect(result.metadata.image).toEqual(tier.metadata.image);
        });

        it("should not contain `image` property if image property doesn't exist either on NFT or tier", async () => {
            await userService.createUser({
                email: faker.internet.email(),
                password: 'password',
            });

            const wallet = await walletService.createWallet({
                address: faker.finance.ethereumAddress(),
            });

            const collection = await collectionService.createCollection({
                name: faker.company.name(),
                displayName: 'The best collection',
                about: 'The best collection ever',
                address: faker.finance.ethereumAddress(),
                artists: [],
                tags: [],
                creator: { id: wallet.id },
            });

            const tier = await tierService.createTier({
                name: faker.company.name(),
                totalMints: 100,
                collection: { id: collection.id },
                price: '100',
                tierId: 0,
                metadata: {
                    uses: [],
                    properties: {
                        level: {
                            name: '{{level_name}}',
                            type: 'string',
                            value: '{{level}}',
                            display_value: 'Basic',
                        },
                        holding_days: {
                            name: '{{holding_days_name}}',
                            type: 'integer',
                            value: '{{holding_days}}',
                            display_value: 'Days of holding',
                        },
                    },
                    configs: {
                        alias: {
                            level_name: 'real_level_name',
                        },
                    },
                },
            });

            const tokenId = faker.string.numeric({ length: 1, allowLeadingZeros: false });

            const nft = await nftService.createOrUpdateNftByTokenId({
                collectionId: collection.id,
                tierId: tier.id,
                tokenId,
                properties: {
                    level: { value: '1' },
                    holding_days: { value: 10 },
                },
            });

            const nftInfo = await nftRepository.findOne({ where: { id: nft.id }, relations: ['tier'] });

            const result = await nftService.renderMetadata(nftInfo);
            expect(result.metadata.image).toBeFalsy();
        });
    });

    describe('initializePropertiesFromTier', () => {
        it('should handle empty properties', async () => {
            const result = nftService.initializePropertiesFromTier({});
            expect(result).toEqual({});
        });

        it('should add `updated_at` for upgradable properties', async () => {
            const properties = {
                static_property: {
                    name: faker.lorem.word(10),
                    type: 'string',
                    value: faker.lorem.word(10),
                },
                holding_days: {
                    name: 'holding_days',
                    type: 'integer',
                    value: faker.number.int(100),
                    class: 'upgradable',
                    display_value: 'none',
                },
            };
            const result = nftService.initializePropertiesFromTier(properties);
            expect(result['holding_days']).toBeTruthy();
            expect(result['holding_days'].updated_at).toBeTruthy();
            expect(result['holding_days'].updated_at).toBeGreaterThan(addMinutes(new Date(), -1).valueOf());
        });

        it('should replace the template string to 0', async () => {
            const properties = {
                holding_days: {
                    name: 'holding_days',
                    type: 'integer',
                    value: '{{holding_days}}',
                    class: 'upgradable',
                    display_value: 'none',
                },
            };
            const result = nftService.initializePropertiesFromTier(properties);
            expect(result['holding_days']).toBeTruthy();
            expect(result['holding_days'].value).toEqual('0');
        });
    });

    describe('getNftsIdsByProperties', () => {
        let wallet;
        let collection;
        let tier;

        beforeEach(async () => {
            wallet = await walletService.createWallet({
                address: faker.finance.ethereumAddress(),
            });

            collection = await createCollection(collectionService, {
                creator: { id: wallet.id },
            });

            tier = await createTier(tierService, {
                collection: { id: collection.id },
                tierId: 0,
            });
        });

        it('should return the nfts filtered', async () => {
            // missing property
            await nftService.createOrUpdateNftByTokenId({
                collectionId: collection.id,
                tierId: tier.id,
                tokenId: '1',
                properties: {
                    height: {
                        value: '200',
                    },
                },
            });

            // property value is not match
            await nftService.createOrUpdateNftByTokenId({
                collectionId: collection.id,
                tierId: tier.id,
                tokenId: '2',
                properties: {
                    type: {
                        value: 'silver',
                    },
                    height: {
                        value: '100',
                    },
                },
            });

            // property value is not in range
            await nftService.createOrUpdateNftByTokenId({
                collectionId: collection.id,
                tierId: tier.id,
                tokenId: '3',
                properties: {
                    type: {
                        value: 'golden',
                    },
                    height: {
                        value: '100',
                    },
                },
            });

            // property value is matching the min value
            await nftService.createOrUpdateNftByTokenId({
                collectionId: collection.id,
                tierId: tier.id,
                tokenId: '4',
                properties: {
                    type: {
                        value: 'golden',
                    },
                    height: {
                        value: '200',
                    },
                },
            });

            // property value is matching the max value
            await nftService.createOrUpdateNftByTokenId({
                collectionId: collection.id,
                tierId: tier.id,
                tokenId: '5',
                properties: {
                    type: {
                        value: 'golden',
                    },
                    height: {
                        value: '300',
                    },
                },
            });

            // property value exceeds the max value
            await nftService.createOrUpdateNftByTokenId({
                collectionId: collection.id,
                tierId: tier.id,
                tokenId: '6',
                properties: {
                    type: {
                        value: 'golden',
                    },
                    height: {
                        value: '400',
                    },
                },
            });

            const typeFilter = [
                {
                    name: 'type',
                    value: 'golden',
                },
            ];

            const tokenIdsWithEmptyFilter = await nftService.getNftsIdsByProperties(collection.id, []);
            expect(tokenIdsWithEmptyFilter).toEqual(['1', '2', '3', '4', '5', '6']);

            const tokenIdsWithGoldenType = await nftService.getNftsIdsByProperties(collection.id, typeFilter);
            expect(tokenIdsWithGoldenType).toEqual(['3', '4', '5', '6']);

            const heightFilter = [
                {
                    name: 'height',
                    range: [200, 300],
                },
            ];
            const tokenIdsWithinHeightRange = await nftService.getNftsIdsByProperties(collection.id, heightFilter);
            expect(tokenIdsWithinHeightRange).toEqual(['1', '4', '5']);

            const combinedFiler = [
                {
                    name: 'type',
                    value: 'golden',
                },
                {
                    name: 'height',
                    range: [200, 300],
                },
            ];

            const nftIds = await nftService.getNftsIdsByProperties(collection.id, combinedFiler);
            expect(nftIds).toEqual(['4', '5']);
        });
    });

    describe('getNftsIdsByPlugins', () => {
        it('should return the nfts ids filtered', async () => {
            const plugins = ['pluginA', 'pluginB'];
            const collection = await createCollection(
                collectionService, { tokenAddress: faker.finance.ethereumAddress() });
            const merkleTree1 = await createRecipientsMerkleTree(
                merkleTreeService, collection.address, [1, 2, 3, 4]);
            const merkleTree2 = await createRecipientsMerkleTree(
                merkleTreeService, collection.address, [3, 4, 5, 6]);
            const plugin1 = await createPlugin2();
            await createCollectionPlugin(
                collection.id,
                plugin1.id,
                {
                    name: plugins[0],
                    merkleRoot: merkleTree1.merkleRoot,
                }
            );
            const pluginB = await createPlugin2({ name: plugins[1] });
            await createCollectionPlugin(
                collection.id,
                pluginB.id,
                {
                    name: plugins[1],
                    merkleRoot: merkleTree2.merkleRoot,
                }
            );
            const tokenIds = await nftService.getNftsIdsByPlugins(plugins);
            expect(tokenIds).toEqual([3, 4]);
        });
    });
});
