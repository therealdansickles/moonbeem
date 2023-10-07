import { faker } from '@faker-js/faker';
import { CollectionPluginService } from './collectionPlugin.service';
import {
    createAsset721,
    createCollection,
    createOrganization,
    createPlugin,
    createRecipientsMerkleTree
} from '../test-utils';
import { CollectionService } from '../collection/collection.service';
import { UserService } from '../user/user.service';
import { OrganizationService } from '../organization/organization.service';
import { Plugin } from '../plugin/plugin.entity';
import { Repository } from 'typeorm';
import { MerkleTreeService } from '../merkleTree/merkleTree.service';
import { Asset721Service } from '../sync-chain/asset721/asset721.service';

describe('CollectionPluginService', () => {
    let service: CollectionPluginService;
    let collectionService: CollectionService;
    let userService: UserService;
    let organizationService: OrganizationService;
    let pluginRepository: Repository<Plugin>;
    let merkleTreeService: MerkleTreeService;
    let asset721Service: Asset721Service;

    beforeAll(async () => {
        service = global.collectionPluginService;
        collectionService = global.collectionService;
        userService = global.userService;
        organizationService = global.organizationService;
        pluginRepository = global.pluginRepository;
        merkleTreeService = global.merkleTreeService;
        asset721Service = global.asset721Service;
    });

    afterEach(async () => {
        await global.clearDatabase();
        (await global.gc) && (await global.gc());
    });

    describe('createCollectionPlugin', () => {
        let collection;
        let plugin;

        beforeAll(async () => {
            const user = await userService.createUser({
                username: faker.internet.userName(),
                email: faker.internet.email(),
                password: 'password',
            });

            const organization = await createOrganization(organizationService, { owner: user });
            collection = await createCollection(collectionService, { organization });
            plugin = await createPlugin(pluginRepository, { organization });
        });

        it('should create a collection plugin', async () => {
            const input = {
                collectionId: collection.id,
                pluginId: plugin.id,
                name: 'test collection plugin',
                pluginDetail: {
                    properties: {
                        Color: 'red',
                    },
                    recipients: ['1', '2'],
                    filters: {
                        Color: 'red',
                    },
                },
            };
            const collectionPlugin = await service.createCollectionPlugin(input);

            expect(collectionPlugin).toBeDefined();
            expect(collectionPlugin.collection.id).toEqual(collection.id);
            expect(collectionPlugin.plugin.id).toEqual(plugin.id);
            expect(collectionPlugin.pluginDetail).toEqual(input.pluginDetail);
            expect(collectionPlugin.name).toEqual(input.name);
        });
    });

    describe('getCollectionPlugin[s]', () => {
        let collection;
        let plugin;

        beforeEach(async () => {
            const user = await userService.createUser({
                username: faker.internet.userName(),
                email: faker.internet.email(),
                password: 'password',
            });

            const organization = await createOrganization(organizationService, { owner: user });
            collection = await createCollection(collectionService, { organization });
            plugin = await createPlugin(pluginRepository, { organization });
        });

        it('should get a collection plugin', async () => {
            const input = {
                collectionId: collection.id,
                pluginId: plugin.id,
                name: 'test collection plugin',
                pluginDetail: {
                    properties: {
                        Color: 'red',
                    },
                    recipients: ['1', '2'],
                    filters: {
                        Color: 'red',
                    },
                },
            };
            const collectionPlugin = await service.createCollectionPlugin(input);
            const result = await service.getCollectionPlugin(collectionPlugin.id);

            expect(result).toBeDefined();
            expect(result.collection.id).toEqual(collection.id);
            expect(result.plugin.id).toEqual(plugin.id);
            expect(result.pluginDetail).toEqual(input.pluginDetail);
            expect(result.name).toEqual(input.name);
        });

        it('should get all collection plugins given collection id', async () => {
            const input = {
                collectionId: collection.id,
                pluginId: plugin.id,
                name: 'test collection plugin',
            };
            await service.createCollectionPlugin(input);

            const input2 = {
                collectionId: collection.id,
                pluginId: plugin.id,
                name: 'test collection plugin 2',
            };
            await service.createCollectionPlugin(input2);
            const result = await service.getCollectionPluginsByCollectionId(collection.id);

            expect(result).toBeDefined();
            expect(result.length).toEqual(2);
        });
    });

    describe('getCollectionPlugin[s]', () => {
        let collection;
        let plugin;
        let collectionPlugin;

        beforeEach(async () => {
            const user = await userService.createUser({
                username: faker.internet.userName(),
                email: faker.internet.email(),
                password: 'password',
            });

            const organization = await createOrganization(organizationService, { owner: user });
            collection = await createCollection(collectionService, { organization });
            plugin = await createPlugin(pluginRepository, { organization });
            const input = {
                collectionId: collection.id,
                pluginId: plugin.id,
                name: 'test collection plugin',
                pluginDetail: {
                    properties: {
                        Color: 'red',
                    },
                    recipients: ['1', '2'],
                    filters: {
                        Color: 'red',
                    },
                },
            };
            collectionPlugin = await service.createCollectionPlugin(input);
        });

        it('should update a collection plugin', async () => {
            const id = collectionPlugin.id;
            const input = {
                id,
                name: faker.company.name(),
                description: faker.lorem.sentence(),
                mediaUrl: faker.internet.url(),
                pluginDetail: {
                    properties: {
                        Color: 'Green',
                    },
                    recipients: ['2', '5'],
                    filters: {
                        Color: 'Green',
                    },
                    contract: faker.finance.ethereumAddress(),
                },
                merkleRoot: faker.string.hexadecimal({ length: 66, casing: 'lower' }),
            };
            const updatedCollectionPlugin = await service.updateCollectionPlugin(input);

            expect(updatedCollectionPlugin).toBeDefined();
            expect(updatedCollectionPlugin.id).toEqual(id);
            expect(updatedCollectionPlugin.name).toEqual(input.name);
            expect(updatedCollectionPlugin.description).toEqual(input.description);
            expect(updatedCollectionPlugin.mediaUrl).toEqual(input.mediaUrl);
            expect(updatedCollectionPlugin.pluginDetail).toEqual(input.pluginDetail);
            expect(updatedCollectionPlugin.merkleRoot).toEqual(input.merkleRoot);
        });
    });

    describe('TokenInstalledPlugins', () => {
        const token1 = '1';
        const token2 = '2';
        const token3 = '3';

        let collection1;
        let collection2;
        let plugin;
        let pluginWithMerkleRoot1;
        let pluginWithMerkleRoot2;
        let pluginWithoutMerkleRoot;

        beforeEach(async () => {
            const user = await userService.createUser({
                username: faker.internet.userName(),
                email: faker.internet.email(),
                password: 'password',
            });

            const organization = await createOrganization(organizationService, { owner: user });
            collection1 = await createCollection(
                collectionService, { organization, tokenAddress: faker.finance.ethereumAddress() });
            collection2 = await createCollection(
                collectionService, { organization, tokenAddress: faker.finance.ethereumAddress() });
            const merkleTree1 = await createRecipientsMerkleTree(merkleTreeService, collection1.address, [token1]);
            const merkleTree2 = await createRecipientsMerkleTree(merkleTreeService, collection2.address, [token3]);
            plugin = await createPlugin(pluginRepository, { organization });

            const input1 = {
                collectionId: collection1.id,
                pluginId: plugin.id,
                name: 'merkle root 1 test collection plugin',
                pluginDetail: {},
            };
            pluginWithMerkleRoot1 = await service.createCollectionPlugin(input1);
            const updateInput1 = {
                id: pluginWithMerkleRoot1.id,
                merkleRoot: merkleTree1.merkleRoot,
            };
            pluginWithMerkleRoot1 = await service.updateCollectionPlugin(updateInput1);

            const input2 = {
                collectionId: collection2.id,
                pluginId: plugin.id,
                name: 'merkle root 2 test collection plugin',
                pluginDetail: {
                    collectionAddress: collection2.address,
                    tokenAddress: collection2.tokenAddress,
                },
            };
            pluginWithMerkleRoot2 = await service.createCollectionPlugin(input2);
            const updateInput2 = {
                id: pluginWithMerkleRoot2.id,
                merkleRoot: merkleTree2.merkleRoot,
            };
            pluginWithMerkleRoot2 = await service.updateCollectionPlugin(updateInput2);

            const input3 = {
                collectionId: collection2.id,
                pluginId: plugin.id,
                name: 'test collection plugin',
                pluginDetail: {
                    collectionAddress: collection2.address,
                    tokenAddress: collection2.tokenAddress,
                },
            };
            pluginWithoutMerkleRoot = await service.createCollectionPlugin(input3);
        });

        // collection 1 -> apply pluginWithoutMerkleRoot
        it('should return true if the plugin applied to the whole collection', async () => {
            const result = await service.checkIfPluginApplied(pluginWithoutMerkleRoot, token3);
            expect(result).toBeTruthy();
        });

        // collection 1 -> token 1 -> apply pluginWithMerkleRoot1
        it('should return true if the token id is included in the merkle data', async () => {
            const result = await service.checkIfPluginApplied(pluginWithMerkleRoot1, token1);
            expect(result).toBeTruthy();
        });

        // collection 1 -> token 2 -> not apply pluginWithMerkleRoot1
        it('should return false if the token id is not included in the merkle data', async () => {
            console.log('merkleRoot', pluginWithMerkleRoot1.merkleRoot);
            const result = await service.checkIfPluginApplied(pluginWithMerkleRoot1, token2);
            expect(result).toBeFalsy();
        });

        // collection 1 -> token 2 -> not apply pluginWithMerkleRoot1
        it('should return empty if the tokenId is not applied to any plugins', async () => {
            const result = await service.getTokenInstalledPlugins(collection1.id, token2);
            expect(result).toEqual([]);
        });

        // collection 2 -> apply pluginWithoutMerkleRoot
        // collection 2 -> token 3 -> apply pluginWithMerkleRoot2
        it('should return all plugins applied to this token', async () => {
            const result = await service.getTokenInstalledPlugins(collection2.id, token3);
            expect(result).toEqual([{
                name: pluginWithoutMerkleRoot.name,
                collectionAddress: collection2.address,
                tokenAddress: collection2.tokenAddress,
                pluginName: plugin.name,
                claimed: false,
            }, {
                name: pluginWithMerkleRoot2.name,
                collectionAddress: collection2.address,
                tokenAddress: collection2.tokenAddress,
                pluginName: plugin.name,
                claimed: false,
            }]);
        });
    });

    describe('getAppliedTokensCount', function () {
        let collection;
        let plugin;
        let merkleTree;

        beforeEach(async () => {
            const user = await userService.createUser({
                username: faker.internet.userName(),
                email: faker.internet.email(),
                password: 'password',
            });

            const organization = await createOrganization(organizationService, { owner: user });
            collection = await createCollection(collectionService, { organization });
            const token1 = '1';
            const token2 = '2';
            const token3 = '3';
            merkleTree = await createRecipientsMerkleTree(
                merkleTreeService, collection.address, [token1, token2, token3]);
            plugin = await createPlugin(pluginRepository, { organization });
        });

        it('should return total supply if merkle root is empty', async () => {
            const input = {
                collectionId: collection.id,
                pluginId: plugin.id,
                name: 'collection plugin without merkle root',
                pluginDetail: {},
            };
            const collectionPlugin = await service.createCollectionPlugin(input);
            const result = await service.getAppliedTokensCount(collectionPlugin, 100);
            expect(result).toEqual(100);
        });

        it('should return the number of applied tokens if merkle root is present', async () => {
            const input = {
                collectionId: collection.id,
                pluginId: plugin.id,
                name: 'collection plugin with merkle root',
                merkleRoot: merkleTree.merkleRoot,
                pluginDetail: {},
            };
            const collectionPlugin = await service.createCollectionPlugin(input);
            const result = await service.getAppliedTokensCount(collectionPlugin, 100);
            expect(result).toEqual(3);
        });
    });

    describe('deleteCollectionPlugin', function () {
        it('should delete collection plugin', async () => {
            const collection = await createCollection(collectionService);
            const plugin = await createPlugin(pluginRepository);
            const input = {
                collectionId: collection.id,
                pluginId: plugin.id,
                name: 'test collection plugin',
                pluginDetail: {},
            };
            const collectionPlugin = await service.createCollectionPlugin(input);
            const result = await service.deleteCollectionPlugin(collectionPlugin.id);
            const deleted = await service.getCollectionPlugin(collectionPlugin.id);
            expect(result).toBeTruthy();
            expect(deleted).toBeNull();
        });
    });

    describe('checkIfPluginClaimed', function () {
        it('should return true if the token is claimed', async () => {
            const tokenId = '1';
            const collection = await createCollection(
                collectionService, { tokenAddress: faker.finance.ethereumAddress() });
            const plugin = await createPlugin(pluginRepository);
            const input = {
                collectionId: collection.id,
                pluginId: plugin.id,
                name: 'test collection plugin',
                pluginDetail: {
                    tokenAddress: collection.tokenAddress
                },
            };
            const collectionPlugin = await service.createCollectionPlugin(input);
            await createAsset721(asset721Service, {
                tokenId,
                address: collection.tokenAddress,
            });
            const result = await service.checkIfPluginClaimed(collectionPlugin, tokenId);
            expect(result).toBeTruthy();
        });

        it('should return false if the token is not claimed', async () => {
            const collection = await createCollection(collectionService);
            const plugin = await createPlugin(pluginRepository);
            const input = {
                collectionId: collection.id,
                pluginId: plugin.id,
                name: 'test collection plugin',
                pluginDetail: {},
            };
            const collectionPlugin = await service.createCollectionPlugin(input);
            const result = await service.checkIfPluginClaimed(collectionPlugin, '1');
            expect(result).toBeFalsy();
        });
    });
});
