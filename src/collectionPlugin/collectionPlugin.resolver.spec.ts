import * as request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { createCollection, createOrganization, createPlugin, getToken } from '../test-utils';
import { CollectionService } from '../collection/collection.service';
import { UserService } from '../user/user.service';
import { OrganizationService } from '../organization/organization.service';
import { Plugin } from '../plugin/plugin.entity';
import { Repository } from 'typeorm';
import { faker } from '@faker-js/faker';
import { CollectionPluginService } from './collectionPlugin.service';

export const gql = String.raw;

describe('MerkleTreeResolver', () => {
    let collectionPluginService: CollectionPluginService;
    let collectionService: CollectionService;
    let userService: UserService;
    let organizationService: OrganizationService;
    let pluginRepository: Repository<Plugin>;
    let app: INestApplication;

    beforeAll(async () => {
        app = global.app;
        collectionPluginService = global.collectionPluginService;
        collectionService = global.collectionService;
        userService = global.userService;
        organizationService = global.organizationService;
        pluginRepository = global.pluginRepository;
    });

    afterEach(async () => {
        await global.clearDatabase();
        global.gc && global.gc();
    });

    describe('CollectionPluginResolver', () => {
        let user;
        let organization;
        let collection;
        let plugin;

        beforeEach(async () => {
            user = await userService.createUser({
                username: faker.internet.userName(),
                email: faker.internet.email(),
                password: 'password',
            });

            organization = await createOrganization(organizationService, { owner: user });
            collection = await createCollection(collectionService, { organization });
            plugin = await createPlugin(pluginRepository, { organization });
        });

        it('should create collection plugin', async () => {
            const input = {
                collectionId: collection.id,
                pluginId: plugin.id,
                name: faker.company.name(),
                description: faker.lorem.paragraph(),
                mediaUrl: faker.image.url(),
                merkleRoot: faker.string.hexadecimal({ length: 66, casing: 'lower' }),
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
            const query = gql`
                mutation CreateCollectionPlugin($input: CreateCollectionPluginInput!) {
                    createCollectionPlugin(input: $input) {
                        name
                        description
                        mediaUrl
                        pluginDetail
                        merkleRoot
                        plugin {
                            name
                        }
                        collection {
                            name
                        }
                    }
                }
            `;
            const variables = { input };
            const token = await getToken(app, user.email);

            return await request(app.getHttpServer())
                .post('/graphql')
                .auth(token, { type: 'bearer' })
                .send({ query, variables })
                .expect(200)
                .expect(({ body }) => {
                    expect(body.data.createCollectionPlugin).toBeDefined();
                    expect(body.data.createCollectionPlugin.name).toBe(input.name);
                    expect(body.data.createCollectionPlugin.description).toBe(input.description);
                    expect(body.data.createCollectionPlugin.mediaUrl).toBe(input.mediaUrl);
                    expect(body.data.createCollectionPlugin.pluginDetail).toStrictEqual(input.pluginDetail);
                    expect(body.data.createCollectionPlugin.merkleRoot).toBe(input.merkleRoot);
                    expect(body.data.createCollectionPlugin.plugin.name).toBe(plugin.name);
                    expect(body.data.createCollectionPlugin.collection.name).toBe(collection.name);
                });
        });

        it('should get collection plugins', async () => {
            const input1 = {
                collectionId: collection.id,
                pluginId: plugin.id,
                name: faker.company.name(),
                description: faker.lorem.paragraph(),
                mediaUrl: faker.image.url(),
                merkleRoot: faker.string.hexadecimal({ length: 66, casing: 'lower' }),
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
            await collectionPluginService.createCollectionPlugin(input1);
            const input2 = {
                collectionId: collection.id,
                pluginId: plugin.id,
                name: 'test collection plugin 2',
            };
            await collectionPluginService.createCollectionPlugin(input2);

            const query = gql`
                query GetCollectionPlugins($collectionId: String!) {
                    collectionPlugins(collectionId: $collectionId) {
                        name
                        description
                        mediaUrl
                        pluginDetail
                        merkleRoot
                        plugin {
                            name
                        }
                        collection {
                            name
                        }
                    }
                }
            `;
            const variables = { collectionId: collection.id };
            const token = await getToken(app, user.email);

            return await request(app.getHttpServer())
                .post('/graphql')
                .auth(token, { type: 'bearer' })
                .send({ query, variables })
                .expect(200)
                .expect(({ body }) => {
                    expect(body.data.collectionPlugins).toBeDefined();
                    expect(body.data.collectionPlugins.length).toEqual(2);
                });
        });

        it('should update collection plugin', async () => {
            const createCollectionPluginInput = {
                collectionId: collection.id,
                pluginId: plugin.id,
                name: faker.company.name(),
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
            const collectionPlugin = await collectionPluginService.createCollectionPlugin(createCollectionPluginInput);
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

            const query = gql`
                mutation UpdateCollectionPlugin($input: UpdateCollectionPluginInput!) {
                    updateCollectionPlugin(input: $input) {
                        name
                        description
                        mediaUrl
                        pluginDetail
                        merkleRoot
                        plugin {
                            name
                        }
                        collection {
                            name
                        }
                    }
                }
            `;
            const variables = { input };
            const token = await getToken(app, user.email);

            return await request(app.getHttpServer())
                .post('/graphql')
                .auth(token, { type: 'bearer' })
                .send({ query, variables })
                .expect(200)
                .expect(({ body }) => {
                    const updatedCollectionPlugin = body.data.updateCollectionPlugin;
                    expect(updatedCollectionPlugin).toBeDefined();
                    expect(updatedCollectionPlugin.name).toBe(input.name);
                    expect(updatedCollectionPlugin.description).toBe(input.description);
                    expect(updatedCollectionPlugin.mediaUrl).toBe(input.mediaUrl);
                    expect(updatedCollectionPlugin.pluginDetail).toStrictEqual(input.pluginDetail);
                    expect(updatedCollectionPlugin.merkleRoot).toBe(input.merkleRoot);
                    expect(updatedCollectionPlugin.plugin.name).toBe(plugin.name);
                    expect(updatedCollectionPlugin.collection.name).toBe(collection.name);
                });
        });
    });
});
