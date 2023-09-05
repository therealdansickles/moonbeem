import { faker } from '@faker-js/faker';
import { CollectionPluginService } from './collectionPlugin.service';
import { createCollection, createOrganization, createPlugin } from '../test-utils';
import { CollectionService } from '../collection/collection.service';
import { UserService } from '../user/user.service';
import { OrganizationService } from '../organization/organization.service';
import { Plugin } from '../plugin/plugin.entity';
import { Repository } from 'typeorm';

describe('CollectionPluginService', () => {
    let service: CollectionPluginService;
    let collectionService: CollectionService;
    let userService: UserService;
    let organizationService: OrganizationService;
    let pluginRepository: Repository<Plugin>;

    beforeAll(async () => {
        service = global.collectionPluginService;
        collectionService = global.collectionService;
        userService = global.userService;
        organizationService = global.organizationService;
        pluginRepository = global.pluginRepository;
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
});
