import BigNumber from 'bignumber.js';
import { ethers } from 'ethers';
import { Repository } from 'typeorm';

import { faker } from '@faker-js/faker';

import { CollectionKind } from '../collection/collection.entity';
import { CollectionService } from '../collection/collection.service';
import { CollectionPluginService } from '../collectionPlugin/collectionPlugin.service';
import { MerkleTreeService } from '../merkleTree/merkleTree.service';
import { OrganizationService } from '../organization/organization.service';
import { Plugin } from '../plugin/plugin.entity';
import { Asset721Service } from '../sync-chain/asset721/asset721.service';
import { CoinQuotes } from '../sync-chain/coin/coin.dto';
import { CoinService } from '../sync-chain/coin/coin.service';
import { MintSaleContractService } from '../sync-chain/mint-sale-contract/mint-sale-contract.service';
import { MintSaleTransactionService } from '../sync-chain/mint-sale-transaction/mint-sale-transaction.service';
import {
    createAsset721,
    createCollection,
    createMintSaleContract,
    createMintSaleTransaction,
    createOrganization,
    createPlugin,
    createRecipientsMerkleTree,
    createTier,
} from '../test-utils';
import { TierService } from '../tier/tier.service';
import { UserService } from '../user/user.service';
import { Wallet } from './wallet.entity';
import { WalletService } from './wallet.service';

describe('WalletService', () => {
    let address: string;
    let organizationService: OrganizationService;
    let collectionService: CollectionService;
    let mintSaleTransactionService: MintSaleTransactionService;
    let mintSaleContractService: MintSaleContractService;
    let service: WalletService;
    let tierService: TierService;
    let userService: UserService;
    let coinService: CoinService;
    let asset721Service: Asset721Service;
    let merkleTreeService: MerkleTreeService;
    let collectionPluginService: CollectionPluginService;
    let pluginRepository: Repository<Plugin>;

    beforeAll(async () => {
        address = faker.finance.ethereumAddress().toLowerCase();
        service = global.walletService;
        organizationService = global.organizationService;
        collectionService = global.collectionService;
        mintSaleTransactionService = global.mintSaleTransactionService;
        mintSaleContractService = global.mintSaleContractService;
        tierService = global.tierService;
        userService = global.userService;
        coinService = global.coinService;
        asset721Service = global.asset721Service;
        pluginRepository = global.pluginRepository;
        merkleTreeService = global.merkleTreeService;
        collectionPluginService = global.collectionPluginService;
    });

    afterEach(async () => {
        await global.clearDatabase();
        global.gc && global.gc();
    });

    describe('getWallet', () => {
        it('should return a wallet by id', async () => {
            const wallet = await service.createWallet({ address: faker.finance.ethereumAddress().toLowerCase() });
            const result = await service.getWallet(wallet.id);
            expect(result.id).toBeDefined();
        });
    });

    describe('getWalletByQuery', () => {
        it('should return null if no parameter provided', async () => {
            await service.createWallet({
                address: faker.finance.ethereumAddress(),
                name: faker.internet.userName(),
            });
            const result = await service.getWalletByQuery({});
            expect(result).toBeNull();
        });

        it('should return a wallet by name', async () => {
            const wallet = await service.createWallet({
                address: faker.finance.ethereumAddress(),
                name: faker.internet.userName(),
            });
            const result = await service.getWalletByQuery({ name: wallet.name });
            expect(result.address).toEqual(wallet.address);
        });

        it('should return a wallet by address', async () => {
            const wallet = await service.createWallet({
                address: faker.finance.ethereumAddress(),
                name: faker.internet.userName(),
            });
            const result = await service.getWalletByQuery({ address: wallet.address });
            expect(result.name).toEqual(wallet.name);
        });
    });

    describe('createWallet', () => {
        it('should create a wallet', async () => {
            const walletAddress = faker.finance.ethereumAddress().toUpperCase();
            const result = await service.createWallet({ address: walletAddress, name: 'dog', about: 'hihi' });
            expect(result.id).toBeDefined();
            expect(result.address).toEqual(walletAddress.toLowerCase());
            expect(result.name).toEqual('dog');
            expect(result.about).toEqual('hihi');
        });

        it('should error if the wallet already exists', async () => {
            await service.createWallet({ address });
            expect(async () => {
                await service.createWallet({ address });
            });
        });

        it('should use wallet address if name is not provided.', async () => {
            const address = faker.finance.ethereumAddress();
            const wallet = await service.createWallet({ address });
            expect(wallet.address).toEqual(address.toLowerCase());
            expect(wallet.name).toEqual(address.toLowerCase());
        });

        it('should error if the wallet name have a address string.', async () => {
            try {
                await service.createWallet({
                    address: faker.finance.ethereumAddress(),
                    name: faker.finance.ethereumAddress(),
                });
            } catch (error) {
                expect((error as Error).message).toBe(`Wallet name can't be in the address format.`);
            }
        });

        it('should error if the wallet name have been used.', async () => {
            const name = faker.internet.userName();
            await service.createWallet({
                address: faker.finance.ethereumAddress(),
                name,
            });
            try {
                await service.createWallet({ address: faker.finance.ethereumAddress(), name });
            } catch (error) {
                expect((error as Error).message).toBe(`Wallet name ${name} already existed.`);
            }
        });
    });

    describe('bindWallet', () => {
        let unboundWallet: Wallet;
        let eipAddress: string;
        let ownerId: string;
        let wallet: ethers.HDNodeWallet;
        let message: string;
        let signature: string;

        beforeEach(async () => {
            const owner = await userService.createUser({
                email: faker.internet.email(),
                password: 'password',
            });

            wallet = ethers.Wallet.createRandom();
            message = 'Hi from tests!';
            signature = await wallet.signMessage(message);

            ownerId = owner.id;
            const unboundWallet = await service.createWallet({ address: wallet.address.toLowerCase() });
            eipAddress = unboundWallet.address.toLowerCase();
        });

        it.skip('should handle an EIP-3770 address', async () => {
            const data = { address: unboundWallet.address, owner: { id: ownerId }, message, signature };
            const result = await service.bindWallet(data);
            expect(result.owner).toEqual(ownerId);
        });

        it('should handle an existing address', async () => {
            const data = { address: eipAddress, owner: { id: ownerId }, message, signature };
            const result = await service.bindWallet(data);
            expect(result.owner.id).toEqual(ownerId);
        });

        it('should create a new wallet with given owner', async () => {
            const newWallet = ethers.Wallet.createRandom();
            const newSignature = await newWallet.signMessage(message);
            const data = { address: newWallet.address, owner: { id: ownerId }, message, signature: newSignature };
            const result = await service.bindWallet(data);
            expect(result.owner.id).toEqual(ownerId);
            expect(result.address).toEqual(newWallet.address.toLowerCase());
        });

        it('should throw an error if the wallet is already bound', async () => {
            const data = { address: eipAddress, owner: { id: ownerId }, message, signature };
            await service.bindWallet(data);
            const anotherOwner = await userService.createUser({
                email: faker.internet.email(),
                password: faker.internet.password(),
            });
            message = 'Hi from tests!';
            signature = await wallet.signMessage(message);
            await expect(
                async () =>
                    await service.bindWallet({
                        address: eipAddress,
                        owner: { id: anotherOwner.id },
                        message,
                        signature,
                    }),
            ).rejects.toThrow(
                `The wallet at ${eipAddress} is already connected to an existing account. Please connect another wallet to this account.`,
            );
        });
    });

    describe('unbindWallet', () => {
        let boundWallet: Wallet;
        let address: string;
        let wallet: ethers.HDNodeWallet;
        let message: string;
        let owner: any;

        beforeAll(async () => {
            owner = await userService.createUser({
                email: faker.internet.email(),
                password: 'password',
            });

            wallet = ethers.Wallet.createRandom();
            message = 'Hi from tests!';
            address = wallet.address.toLowerCase();

            boundWallet = await service.createWallet({ address, ownerId: owner.id });
        });

        // NB: We don't test for a regular address because that defaults to ethereum.
        // You can only use an EIP-3770 address if you are on another chain.
        it.skip('should handle an EIP-3770 address', async () => {
            const data = { address, owner: { id: boundWallet.owner.id } };
            const result = await service.unbindWallet(data);
            expect(result.owner).not.toEqual(boundWallet.owner);
            expect(result.address).toEqual(boundWallet.address.toLowerCase());
            // expect(result.chainId).toEqual(boundWallet.chainId);
        });

        it('should return a new unbound wallet if it the wallet does not exist', async () => {
            const data = { address: faker.finance.ethereumAddress(), owner: { id: owner.id } };
            const result = await service.unbindWallet(data);
            // expect(result.owner.id).not.toEqual(service.unOwnedId);
            expect(result.address).toEqual(data.address.toLowerCase());
            // expect(result.chainId).toEqual(42161);
        });

        it('should throw an error if the wallet is not bound to the user', async () => {
            const owner = await userService.createUser({
                email: faker.internet.email(),
                password: 'password',
            });
            const nonOwner = await userService.createUser({
                email: faker.internet.email(),
                password: 'password',
            });
            const newWallet = ethers.Wallet.createRandom();
            const newSignature = await newWallet.signMessage(message);

            await service.createWallet({ address: newWallet.address });
            await service.bindWallet({
                address: newWallet.address.toLowerCase(),
                owner: { id: owner.id },
                message,
                signature: newSignature,
            });
            const data = { address: newWallet.address.toLowerCase(), owner: { id: nonOwner.id } };
            try {
                await service.unbindWallet(data);
            } catch (error) {
                expect((error as Error).message).toBe(`Wallet ${newWallet.address.toLowerCase()} doesn't belong to the given user.`);
            }
        });
    });

    describe('verifyWallet', () => {
        it('should return a valid wallet if the signature is valid', async () => {
            const wallet = ethers.Wallet.createRandom();
            const message = 'Hi from tests!';
            const signature = await wallet.signMessage(message);
            const result = await service.verifyWallet(wallet.address, message, signature);
            expect(result.address).toEqual(wallet.address.toLowerCase());
        });
    });

    describe('parseEIP3770Address', () => {
        it('parses a valid EIP-3770 address', () => {
            const input = 'eth:0x7cef3dbc9cb5b25f8de7f1a48fa8bcbdbe42caf7';
            const expected: Partial<Wallet> = {
                address: '0x7cef3dbc9cb5b25f8de7f1a48fa8bcbdbe42caf7',
            };
            expect(service.parseEIP3770Address(input)).toEqual(expected);
        });

        it('returns the chainId if its used in the EIP-3770 address', () => {
            const input = '52161:0x7cef3dbc9cb5b25f8de7f1a48fa8bcbdbe42caf7';
            const expected: Partial<Wallet> = {
                address: '0x7cef3dbc9cb5b25f8de7f1a48fa8bcbdbe42caf7',
            };
            expect(service.parseEIP3770Address(input)).toEqual(expected);
        });

        it('throws an error if the address is invalid', () => {
            const input = 'invalid:0x7cef3dbc9cb5b25f8de7f1a48fa8bcbdbe42caf';
            expect(() => service.parseEIP3770Address(input)).toThrow();
        });

        it('defaults to ethereum', () => {
            const input = '0x7cef3dbc9cb5b25f8de7f1a48fa8bcbdbe42caf7';
            const expected: Partial<Wallet> = {
                address: '0x7cef3dbc9cb5b25f8de7f1a48fa8bcbdbe42caf7',
            };
            expect(service.parseEIP3770Address(input)).toEqual(expected);
        });

        it('is case-insensitive for the network part', () => {
            const input = 'ETH:0x7cef3dbc9cb5b25f8de7f1a48fa8bcbdbe42caf7';
            const expected: Partial<Wallet> = {
                address: '0x7cef3dbc9cb5b25f8de7f1a48fa8bcbdbe42caf7',
            };

            expect(service.parseEIP3770Address(input)).toEqual(expected);
        });
    });

    describe('getMintedByAddress', () => {
        it('should return minted transactions by address', async () => {
            const user = await userService.createUser({
                username: faker.internet.userName(),
                email: faker.internet.email(),
                password: 'password',
            });
            const tokenId = '1';
            const wallet = await service.createWallet({ address: faker.finance.ethereumAddress() });

            const organization = await createOrganization(organizationService, { owner: user });
            const collection = await createCollection(collectionService, {
                creator: { id: wallet.id },
                tokenAddress: faker.finance.ethereumAddress(),
            });
            const merkleTree = await createRecipientsMerkleTree(merkleTreeService, collection.address, [parseInt(tokenId)]);
            const plugin = await createPlugin(pluginRepository, { organization });

            const input = {
                collectionId: collection.id,
                pluginId: plugin.id,
                description: faker.lorem.paragraph(),
                mediaUrl: faker.image.url(),
                name: 'merkle root test collection plugin',
                pluginDetail: {
                    collectionAddress: collection.address,
                    tokenAddress: collection.tokenAddress,
                },
                merkleRoot: merkleTree.merkleRoot,
            };
            const collectionPlugin = await collectionPluginService.createCollectionPlugin(input);
            const tier = await createTier(tierService, { collection: { id: collection.id } });
            const transaction = await createMintSaleTransaction(mintSaleTransactionService, {
                recipient: wallet.address,
                address: collection.address,
                tierId: tier.tierId,
                tokenId,
            });
            await createAsset721(asset721Service, {
                address: transaction.tokenAddress,
                tokenId: transaction.tokenId,
                owner: wallet.address,
            });

            const result = await service.getMintedByAddress(wallet.address, '', '', 10, 10);
            expect(result.edges[0].node.address).toEqual(transaction.address);
            expect(result.edges[0].node.tokenAddress).toEqual(transaction.tokenAddress);
            expect(result.edges[0].node.paymentToken).toEqual(transaction.paymentToken);
            expect(result.edges[0].node.tokenId).toEqual(transaction.tokenId);
            expect(result.edges[0].node.price).toEqual(transaction.price);
            expect(result.edges[0].node.txTime).toEqual(transaction.txTime);
            expect(result.edges[0].node.tier.id).toEqual(tier.id);
            expect(result.edges[0].node.tier.collection.id).toEqual(collection.id);
            expect(result.edges[0].node.tier.collection.creator).toBeDefined();
            expect(result.edges[0].node.tier.collection.creator.id).toBeDefined();
            expect(result.edges[0].node.pluginsInstalled).toEqual([
                {
                    id: collectionPlugin.id,
                    name: collectionPlugin.name,
                    description: input.description,
                    mediaUrl: input.mediaUrl,
                    collectionAddress: collectionPlugin.pluginDetail.collectionAddress,
                    tokenAddress: collectionPlugin.pluginDetail.tokenAddress,
                    pluginName: collectionPlugin.plugin.name,
                    claimed: false,
                },
            ]);
            expect(result.edges[0].node.ownerAddress).toEqual(wallet.address);
        });

        it('should return minted transactions by address with pagination', async () => {
            const wallet = await service.createWallet({ address: faker.finance.ethereumAddress() });

            const collection = await createCollection(collectionService);
            const tier = await createTier(tierService, { collection: { id: collection.id } });

            const createdAt = new Date();
            for (let i = 0; i < 15; i++) {
                const txn = await createMintSaleTransaction(mintSaleTransactionService, {
                    recipient: wallet.address,
                    address: collection.address,
                    tierId: tier.tierId,
                    createdAt,
                });
                await createAsset721(asset721Service, {
                    address: txn.tokenAddress,
                    tokenId: txn.tokenId,
                    owner: wallet.address,
                });
            }

            const all = await service.getMintedByAddress(wallet.address, '', '', 20, 0);
            expect(all.edges.length).toEqual(15);

            const firstPage = await service.getMintedByAddress(wallet.address, '', '', 10, 0);
            const firstPageStartCursor = firstPage.pageInfo.startCursor;
            const firstPageEndCursor = firstPage.pageInfo.endCursor;
            expect(firstPage.edges.length).toEqual(10);
            const secondPage = await service.getMintedByAddress(wallet.address, '', firstPageEndCursor, 10, 0);
            const secondPageEndCursor = secondPage.pageInfo.endCursor;
            expect(firstPageEndCursor).not.toEqual(secondPageEndCursor);
            expect(secondPage.edges.length).toEqual(5);
            const sendPageStartCursor = secondPage.pageInfo.startCursor;
            expect(firstPage.edges[0].node.createdAt.getTime()).toBeGreaterThanOrEqual(secondPage.edges[0].node.createdAt.getTime());
            expect(firstPage.edges[0].node.id.localeCompare(secondPage.edges[0].node.id)).toBeGreaterThan(0);
            const previousPage = await service.getMintedByAddress(wallet.address, sendPageStartCursor, '', 0, 10);
            expect(previousPage.edges.length).toEqual(10);
            expect(previousPage.pageInfo.endCursor).toEqual(firstPageStartCursor);
        });
    });

    describe('getActivitiesByAddress', () => {
        it('should return minted transactions and deployed transactions by address', async () => {
            const wallet = await service.createWallet({ address: faker.finance.ethereumAddress() });

            const collection = await collectionService.createCollection({
                name: faker.company.name(),
                displayName: faker.company.name(),
                about: faker.company.name(),
                artists: [],
                tags: [],
                kind: CollectionKind.edition,
                address: faker.finance.ethereumAddress(),
            });

            const tier = await tierService.createTier({
                name: faker.company.name(),
                totalMints: 100,
                tierId: 1,
                collection: { id: collection.id },
                paymentTokenAddress: faker.finance.ethereumAddress(),
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

            const txTime = Math.floor(faker.date.recent().getTime() / 1000);

            // Deploy transaction
            await mintSaleContractService.createMintSaleContract({
                height: parseInt(faker.string.numeric({ length: 5, allowLeadingZeros: false })),
                txHash: faker.string.hexadecimal({ length: 66, casing: 'lower' }),
                txTime,
                sender: wallet.address,
                royaltyReceiver: wallet.address,
                royaltyRate: faker.string.numeric({ length: 2, allowLeadingZeros: false }),
                derivativeRoyaltyRate: faker.string.numeric({ length: 2, allowLeadingZeros: false }),
                isDerivativeAllowed: true,
                beginTime: Math.floor(faker.date.recent().valueOf() / 1000),
                endTime: Math.floor(faker.date.future().valueOf() / 1000),
                price: faker.string.numeric({ length: 5, allowLeadingZeros: false }),
                tierId: tier.tierId,
                address: collection.address,
                paymentToken: faker.finance.ethereumAddress(),
                startId: 0,
                endId: 10,
                currentId: 0,
                tokenAddress: faker.finance.ethereumAddress(),
            });

            // Mint transaction
            await mintSaleTransactionService.createMintSaleTransaction({
                height: parseInt(faker.string.numeric({ length: 5, allowLeadingZeros: false })),
                txHash: faker.string.hexadecimal({ length: 66, casing: 'lower' }),
                txTime: txTime + 1,
                sender: faker.finance.ethereumAddress(),
                recipient: wallet.address,
                address: collection.address,
                tierId: tier.tierId,
                tokenAddress: faker.finance.ethereumAddress(),
                tokenId: faker.string.numeric({ length: 3, allowLeadingZeros: false }),
                price: faker.string.numeric({ length: { min: 18, max: 19 }, allowLeadingZeros: false }),
                paymentToken: faker.finance.ethereumAddress(),
            });

            const list = await service.getActivitiesByAddress(wallet.address);
            const [first, second] = list;
            expect(list.length).toEqual(2);
            expect(first.type).toEqual('Mint');
            expect(second.type).toEqual('Deploy');
            // should be sorted by txTime desc
            expect(first.txTime).toBeGreaterThan(second.txTime);
        });
    });

    describe('updateWallet', () => {
        it('should update wallet', async () => {
            const walletAddress = faker.finance.ethereumAddress().toLowerCase();
            const name = faker.finance.accountName();
            const result = await service.createWallet({ address: walletAddress });

            const updateResult = await service.updateWallet(result.id, { name: name });

            expect(result.id).toBeDefined();
            expect(result.address).toEqual(walletAddress.toLowerCase());
            expect(updateResult.name).toEqual(name);
        });

        it('should error when try to update wallet name have a address string.', async () => {
            const wallet = await service.createWallet({
                address: faker.finance.ethereumAddress(),
                name: faker.internet.domainName(),
            });
            try {
                await service.updateWallet(wallet.id, { name: faker.finance.ethereumAddress() });
            } catch (err) {
                expect(err.message).toEqual(`Wallet name can't be in the address format.`);
            }
        });
    });

    describe('getValueGroupByToken', () => {
        it('should return correct value', async () => {
            const sender1 = faker.finance.ethereumAddress();

            const wallet = await service.createWallet({ address: sender1 });

            const collection = await collectionService.createCollection({
                name: faker.company.name(),
                displayName: 'The best collection',
                about: 'The best collection ever',
                artists: [],
                tags: [],
                kind: CollectionKind.edition,
                address: faker.finance.ethereumAddress(),
            });

            const tier = await tierService.createTier({
                name: faker.company.name(),
                totalMints: 100,
                tierId: 1,
                collection: { id: collection.id },
                paymentTokenAddress: faker.finance.ethereumAddress(),
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

            const paymentToken = faker.finance.ethereumAddress();

            await mintSaleTransactionService.createMintSaleTransaction({
                height: parseInt(faker.string.numeric({ length: 5, allowLeadingZeros: false })),
                txHash: faker.string.hexadecimal({ length: 66, casing: 'lower' }),
                txTime: Math.floor(faker.date.recent().getTime() / 1000),
                sender: sender1,
                recipient: wallet.address,
                address: collection.address,
                tierId: tier.tierId,
                tokenAddress: faker.finance.ethereumAddress(),
                tokenId: faker.string.numeric({ length: 3, allowLeadingZeros: false }),
                price: faker.string.numeric({ length: { min: 18, max: 19 }, allowLeadingZeros: false }),
                paymentToken,
            });
            await mintSaleTransactionService.createMintSaleTransaction({
                height: parseInt(faker.string.numeric({ length: 5, allowLeadingZeros: false })),
                txHash: faker.string.hexadecimal({ length: 66, casing: 'lower' }),
                txTime: Math.floor(faker.date.recent().getTime() / 1000),
                sender: sender1,
                recipient: wallet.address,
                address: collection.address,
                tierId: tier.tierId,
                tokenAddress: faker.finance.ethereumAddress(),
                tokenId: faker.string.numeric({ length: 3, allowLeadingZeros: false }),
                price: faker.string.numeric({ length: { min: 18, max: 19 }, allowLeadingZeros: false }),
                paymentToken,
            });

            await mintSaleContractService.createMintSaleContract({
                height: parseInt(faker.string.numeric({ length: 5, allowLeadingZeros: false })),
                txHash: faker.string.hexadecimal({ length: 66, casing: 'lower' }),
                txTime: Math.floor(faker.date.recent().getTime() / 1000),
                sender: sender1,
                royaltyReceiver: sender1,
                royaltyRate: faker.string.numeric({ length: 2, allowLeadingZeros: false }),
                derivativeRoyaltyRate: faker.string.numeric({ length: 2, allowLeadingZeros: false }),
                isDerivativeAllowed: true,
                beginTime: Math.floor(faker.date.recent().valueOf() / 1000),
                endTime: Math.floor(faker.date.future().valueOf() / 1000),
                price: faker.string.numeric({ length: 5, allowLeadingZeros: false }),
                tierId: tier.tierId,
                address: collection.address,
                paymentToken,
                startId: 0,
                endId: 10,
                currentId: 0,
                tokenAddress: faker.finance.ethereumAddress(),
            });

            const records = await service.getValueGroupByToken(sender1);
            expect(records.length).toEqual(1);
            expect(records[0].token).toBeTruthy();
            expect(+records[0].price).toBeGreaterThan(0);
        });
    });

    describe('getEstimatesByAddress', () => {
        let coin;
        let sender1;
        let wallet;
        let collection;
        let tier;
        let paymentToken;

        beforeEach(async () => {
            coin = await coinService.createCoin({
                address: '0x82af49447d8a07e3bd95bd0d56f35241523fbab1',
                name: 'Wrapped Ether',
                symbol: 'WETH',
                decimals: 18,
                derivedETH: 1,
                derivedUSDC: 1,
                enabled: true,
                chainId: 1,
            });
            sender1 = faker.finance.ethereumAddress();

            wallet = await service.createWallet({ address: sender1 });

            collection = await collectionService.createCollection({
                name: faker.company.name(),
                displayName: 'The best collection',
                about: 'The best collection ever',
                artists: [],
                tags: [],
                kind: CollectionKind.edition,
                address: faker.finance.ethereumAddress(),
            });

            tier = await tierService.createTier({
                name: faker.company.name(),
                totalMints: 100,
                tierId: 1,
                collection: { id: collection.id },
                paymentTokenAddress: faker.finance.ethereumAddress(),
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

            paymentToken = coin.address;
        });

        it('should return correct value', async () => {
            await createMintSaleTransaction(mintSaleTransactionService, {
                sender: sender1,
                recipient: wallet.address,
                address: collection.address,
                tierId: tier.tierId,
                price: '1000000000000000000',
                paymentToken,
            });

            await createMintSaleTransaction(mintSaleTransactionService, {
                sender: sender1,
                recipient: wallet.address,
                address: collection.address,
                tierId: tier.tierId,
                price: '1000000000000000000',
                paymentToken,
            });

            await createMintSaleContract(mintSaleContractService, {
                sender: sender1,
                royaltyReceiver: sender1,
                price: '1000000000000000000',
                tierId: tier.tierId,
                address: collection.address,
                paymentToken,
                startId: 0,
                endId: 10,
                currentId: 0,
            });

            const tokenPriceUSD = faker.number.int({ max: 1000 });
            const mockPriceQuote: CoinQuotes = Object.assign(new CoinQuotes(), {
                USD: { price: tokenPriceUSD },
            });
            jest.spyOn(service['coinService'], 'getQuote').mockResolvedValue(mockPriceQuote);

            const estimatedValue = await service.getEstimatesByAddress(sender1);
            expect(estimatedValue[0].total).toBe('2');
            expect(estimatedValue[0].totalUSDC).toBe((tokenPriceUSD * 2).toString());
        });

        it('should ignore the minted transaction if the payment token is not enabled', async () => {
            (paymentToken = '0x0000000000000000000000000000000000000000'),
                await createMintSaleTransaction(mintSaleTransactionService, {
                    sender: sender1,
                    recipient: wallet.address,
                    address: collection.address,
                    tierId: tier.tierId,
                    price: '0',
                    paymentToken,
                });

            await createMintSaleTransaction(mintSaleTransactionService, {
                sender: sender1,
                recipient: wallet.address,
                address: collection.address,
                tierId: tier.tierId,
                price: '0',
                paymentToken,
            });

            // Should not be counted
            await createMintSaleContract(mintSaleContractService, {
                sender: sender1,
                royaltyReceiver: sender1,
                tierId: tier.tierId,
                address: collection.address,
                paymentToken,
                price: '0',
                startId: 0,
                endId: 10,
                currentId: 0,
            });

            const estimatedValue = await service.getEstimatesByAddress(sender1);
            console.log(JSON.stringify(estimatedValue));
            expect(estimatedValue.length).toBe(0);
        });
    });

    describe('getSold', () => {
        it('it should return a record of all the collections sold at that address.', async () => {
            const coin = await coinService.createCoin({
                address: '0x82af49447d8a07e3bd95bd0d56f35241523fbab1',
                name: 'Wrapped Ether',
                symbol: 'WETH',
                decimals: 18,
                derivedETH: 1,
                derivedUSDC: 1,
                enabled: true,
                chainId: 1,
            });

            const sender1 = faker.finance.ethereumAddress();

            const wallet = await service.createWallet({ address: sender1 });
            const collectionAddress = faker.finance.ethereumAddress();

            const collection = await collectionService.createCollection({
                name: faker.company.name(),
                displayName: 'The best collection',
                about: 'The best collection ever',
                artists: [],
                tags: [],
                kind: CollectionKind.edition,
                address: collectionAddress,
                creator: { id: wallet.id },
            });

            const tier = await tierService.createTier({
                name: faker.company.name(),
                totalMints: 100,
                tierId: 1,
                collection: { id: collection.id },
                paymentTokenAddress: faker.finance.ethereumAddress(),
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

            const paymentToken = coin.address;

            await mintSaleTransactionService.createMintSaleTransaction({
                height: parseInt(faker.string.numeric({ length: 5, allowLeadingZeros: false })),
                txHash: faker.string.hexadecimal({ length: 66, casing: 'lower' }),
                txTime: Math.floor(faker.date.recent().getTime() / 1000),
                sender: sender1,
                recipient: wallet.address,
                address: collection.address,
                tierId: tier.tierId,
                tokenAddress: faker.finance.ethereumAddress(),
                tokenId: faker.string.numeric({ length: 3, allowLeadingZeros: false }),
                price: faker.string.numeric({ length: { min: 18, max: 19 }, allowLeadingZeros: false }),
                paymentToken,
            });
            await mintSaleTransactionService.createMintSaleTransaction({
                height: parseInt(faker.string.numeric({ length: 5, allowLeadingZeros: false })),
                txHash: faker.string.hexadecimal({ length: 66, casing: 'lower' }),
                txTime: Math.floor(faker.date.recent().getTime() / 1000),
                sender: sender1,
                recipient: wallet.address,
                address: collection.address,
                tierId: tier.tierId,
                tokenAddress: faker.finance.ethereumAddress(),
                tokenId: faker.string.numeric({ length: 3, allowLeadingZeros: false }),
                price: faker.string.numeric({ length: { min: 18, max: 19 }, allowLeadingZeros: false }),
                paymentToken,
            });

            const result = await service.getSold(sender1, '', '', 10, 0);
            expect(result.edges).toBeDefined();
            expect(result.totalCount).toBe(2);
        });
    });

    describe('getWalletProfit', () => {
        it.skip('should get wallet profits', async () => {
            const price = faker.string.numeric({ length: { min: 18, max: 19 }, allowLeadingZeros: false });
            const sender1 = faker.finance.ethereumAddress();
            const paymentToken = faker.finance.ethereumAddress();
            const collectionAddress = faker.finance.ethereumAddress();

            const wallet = await service.createWallet({ address: sender1 });

            const coin = await coinService.createCoin({
                address: paymentToken,
                name: 'Wrapped Ether',
                symbol: 'WETH',
                decimals: 18,
                derivedETH: 1,
                derivedUSDC: 1.5,
                enabled: true,
                chainId: 1,
            });

            const collection = await collectionService.createCollection({
                name: faker.company.name(),
                displayName: 'The best collection',
                about: 'The best collection ever',
                artists: [],
                tags: [],
                kind: CollectionKind.edition,
                address: collectionAddress,
                creator: { id: wallet.id },
            });

            await mintSaleTransactionService.createMintSaleTransaction({
                height: parseInt(faker.string.numeric({ length: 5, allowLeadingZeros: false })),
                txHash: faker.string.hexadecimal({ length: 66, casing: 'lower' }),
                txTime: Math.floor(faker.date.recent().getTime() / 1000),
                sender: faker.finance.ethereumAddress(),
                recipient: faker.finance.ethereumAddress(),
                address: collection.address,
                tierId: 1,
                tokenAddress: faker.finance.ethereumAddress(),
                tokenId: faker.string.numeric({ length: 3, allowLeadingZeros: false }),
                price: price,
                paymentToken,
            });
            await mintSaleTransactionService.createMintSaleTransaction({
                height: parseInt(faker.string.numeric({ length: 5, allowLeadingZeros: false })),
                txHash: faker.string.hexadecimal({ length: 66, casing: 'lower' }),
                txTime: Math.floor(faker.date.recent().getTime() / 1000),
                sender: faker.finance.ethereumAddress(),
                recipient: faker.finance.ethereumAddress(),
                address: collection.address,
                tierId: 1,
                tokenAddress: faker.finance.ethereumAddress(),
                tokenId: faker.string.numeric({ length: 3, allowLeadingZeros: false }),
                price: price,
                paymentToken,
            });

            const result = await service.getWalletProfit(sender1);
            expect(result.length).toBeGreaterThan(0);

            const totalProfitInToken = new BigNumber(price).plus(new BigNumber(price)).div(new BigNumber(10).pow(coin.decimals)).toString();

            expect(result[0].inPaymentToken).toBe(totalProfitInToken);
        });
    });

    describe('getMonthlyCollections', () => {
        it('should get the monthly collections for given wallet', async () => {
            const sender = faker.finance.ethereumAddress();
            const wallet = await service.createWallet({ address: sender });

            await collectionService.createCollection({
                name: faker.company.name(),
                displayName: faker.finance.accountName(),
                about: faker.company.name(),
                artists: [],
                tags: [],
                kind: CollectionKind.edition,
                address: faker.finance.ethereumAddress(),
                creator: { id: wallet.id },
            });

            await collectionService.createCollection({
                name: faker.company.name(),
                displayName: faker.finance.accountName(),
                about: faker.company.name(),
                artists: [],
                tags: [],
                kind: CollectionKind.edition,
                address: faker.finance.ethereumAddress(),
                creator: { id: wallet.id },
            });

            const result = await service.getMonthlyCollections(sender);
            expect(result).toBe(2);
        });
    });

    describe('getMonthlyBuyers', () => {
        it('should return the monthly buyers for given wallet', async () => {
            const wallet = await service.createWallet({ address: faker.finance.ethereumAddress() });

            const collection = await collectionService.createCollection({
                name: faker.company.name(),
                displayName: 'The best collection',
                about: 'The best collection ever',
                artists: [],
                tags: [],
                kind: CollectionKind.edition,
                address: faker.finance.ethereumAddress(),
                creator: { id: wallet.id },
            });

            const tier = await tierService.createTier({
                name: faker.company.name(),
                totalMints: 100,
                tierId: 1,
                collection: { id: collection.id },
                paymentTokenAddress: faker.finance.ethereumAddress(),
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

            await mintSaleTransactionService.createMintSaleTransaction({
                height: parseInt(faker.string.numeric({ length: 5, allowLeadingZeros: false })),
                txHash: faker.string.hexadecimal({ length: 66, casing: 'lower' }),
                txTime: Math.floor(new Date().valueOf() / 1000),
                sender: faker.finance.ethereumAddress(),
                recipient: faker.finance.ethereumAddress(),
                address: collection.address,
                tierId: tier.tierId,
                tokenAddress: faker.finance.ethereumAddress(),
                tokenId: faker.string.numeric({ length: 3, allowLeadingZeros: false }),
                price: faker.string.numeric({ length: { min: 18, max: 19 }, allowLeadingZeros: false }),
                paymentToken: faker.finance.ethereumAddress(),
            });
            await mintSaleTransactionService.createMintSaleTransaction({
                height: parseInt(faker.string.numeric({ length: 5, allowLeadingZeros: false })),
                txHash: faker.string.hexadecimal({ length: 66, casing: 'lower' }),
                txTime: Math.floor(new Date().valueOf() / 1000),
                sender: faker.finance.ethereumAddress(),
                recipient: faker.finance.ethereumAddress(),
                address: collection.address,
                tierId: tier.tierId,
                tokenAddress: faker.finance.ethereumAddress(),
                tokenId: faker.string.numeric({ length: 3, allowLeadingZeros: false }),
                price: faker.string.numeric({ length: { min: 18, max: 19 }, allowLeadingZeros: false }),
                paymentToken: faker.finance.ethereumAddress(),
            });

            const result = await service.getMonthlyBuyers(wallet.address);
            expect(result).toBe(2);
        });
    });
    describe('getMonthlyEarnings', () => {
        it('should return the monthly earning for given wallet', async () => {
            const wallet = await service.createWallet({ address: faker.finance.ethereumAddress() });

            const collection = await collectionService.createCollection({
                name: faker.company.name(),
                displayName: 'The best collection',
                about: 'The best collection ever',
                artists: [],
                tags: [],
                kind: CollectionKind.edition,
                address: faker.finance.ethereumAddress(),
                creator: { id: wallet.id },
            });

            const tier = await tierService.createTier({
                name: faker.company.name(),
                totalMints: 100,
                tierId: 1,
                collection: { id: collection.id },
                paymentTokenAddress: faker.finance.ethereumAddress(),
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

            await mintSaleTransactionService.createMintSaleTransaction({
                height: parseInt(faker.string.numeric({ length: 5, allowLeadingZeros: false })),
                txHash: faker.string.hexadecimal({ length: 66, casing: 'lower' }),
                txTime: Math.floor(new Date().valueOf() / 1000),
                sender: faker.finance.ethereumAddress(),
                recipient: faker.finance.ethereumAddress(),
                address: collection.address,
                tierId: tier.tierId,
                tokenAddress: faker.finance.ethereumAddress(),
                tokenId: faker.string.numeric({ length: 3, allowLeadingZeros: false }),
                price: faker.string.numeric({ length: { min: 18, max: 19 }, allowLeadingZeros: false }),
                paymentToken: faker.finance.ethereumAddress(),
            });
            await mintSaleTransactionService.createMintSaleTransaction({
                height: parseInt(faker.string.numeric({ length: 5, allowLeadingZeros: false })),
                txHash: faker.string.hexadecimal({ length: 66, casing: 'lower' }),
                txTime: Math.floor(new Date().valueOf() / 1000),
                sender: faker.finance.ethereumAddress(),
                recipient: faker.finance.ethereumAddress(),
                address: collection.address,
                tierId: tier.tierId,
                tokenAddress: faker.finance.ethereumAddress(),
                tokenId: faker.string.numeric({ length: 3, allowLeadingZeros: false }),
                price: faker.string.numeric({ length: { min: 18, max: 19 }, allowLeadingZeros: false }),
                paymentToken: faker.finance.ethereumAddress(),
            });

            const mockResponse = 1.23456;
            jest.spyOn(service, 'getMonthlyEarnings').mockImplementation(async () => mockResponse);
            const result = await service.getMonthlyEarnings(wallet.address);
            expect(result).toBe(1.23456);
        });
    });
});
