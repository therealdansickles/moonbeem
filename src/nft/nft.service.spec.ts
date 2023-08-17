import { Repository } from 'typeorm';

import { faker } from '@faker-js/faker';

import { CollectionService } from '../collection/collection.service';
import { TierService } from '../tier/tier.service';
import { UserService } from '../user/user.service';
import { WalletService } from '../wallet/wallet.service';
import { Nft } from './nft.entity';
import { NftService } from './nft.service';

describe('NftService', () => {
    let nftRepository: Repository<Nft>;
    let nftService: NftService;
    let tierService: TierService;
    let collectionService: CollectionService;
    let userService: UserService;
    let walletService: WalletService;

    beforeAll(async () => {
        nftRepository = global.nftRepository;
        nftService = global.nftService;
        userService = global.userService;
        walletService = global.walletService;
        collectionService = global.collectionService;
        tierService = global.tierService;
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
                    foo: 'bar',
                },
            });
            expect(result.id).toBeTruthy();
            expect(result.properties.foo).toEqual('bar');
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

            const tokenId = +faker.string.numeric({ length: 1, allowLeadingZeros: false });

            await nftService.createOrUpdateNftByTokenId({
                collectionId: collection.id,
                tierId: tier.id,
                tokenId,
                properties: {
                    foo: 'bar',
                },
            });

            const result = await nftService.createOrUpdateNftByTokenId({
                collectionId: collection.id,
                tierId: tier.id,
                tokenId,
                properties: {
                    foo: 'barrrrr',
                },
            });
            expect(result.id).toBeTruthy();
            expect(result.properties.foo).toEqual('barrrrr');
        });
    });

    describe('#getNftListByQuery', () => {
        it('should work', async () => {
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

            const tokenId1 = faker.string.numeric({ length: 1, allowLeadingZeros: false });
            const tokenId2 = faker.string.numeric({ length: 2, allowLeadingZeros: false });
            const tokenId3 = faker.string.numeric({ length: 4, allowLeadingZeros: false });

            const [nft1, , nft3] = await Promise.all([
                nftService.createOrUpdateNftByTokenId({
                    collectionId: collection.id,
                    tierId: tier.id,
                    tokenId: tokenId1,
                    properties: {
                        foo: 'bar',
                    },
                }),
                nftService.createOrUpdateNftByTokenId({
                    collectionId: collection.id,
                    tierId: tier.id,
                    tokenId: tokenId2,
                    properties: {
                        foo: 'bar',
                    },
                }),
                nftService.createOrUpdateNftByTokenId({
                    collectionId: collection.id,
                    tierId: tier.id,
                    tokenId: tokenId3,
                    properties: {
                        foo: 'bar',
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
                    foo: 'bar',
                },
            });

            const result = await nftService.getNft({
                id: nft.id
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
                    foo: 'bar',
                },
            });

            const result = await nftService.getNft({
                collection: { id: collection.id },
                tokenId,
            });
            expect(result.id).toEqual(nft.id);
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
                    holding_days: { value: 10 }
                },
            });

            const nftInfo = await nftRepository.findOne({ where: { id: nft.id }, relations: ['tier'] });

            const result = await nftService.renderMetadata(nftInfo);
            const renderedProperties = result.metadata.properties;
            expect(renderedProperties['level'].value).toEqual('1');
            expect(renderedProperties['holding_days'].value).toEqual('10');
        });

        it('should render a empty string if there\'s some properties not provided', async () => {
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

        it('should won\'t throw an error if the tier\'s metadata is not in Mustache format', async () => {
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
    });
});
