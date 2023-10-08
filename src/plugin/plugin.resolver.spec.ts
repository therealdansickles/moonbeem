import { ethers } from 'ethers';
import { WalletService } from 'src/wallet/wallet.service';
import * as request from 'supertest';
import { Repository } from 'typeorm';

import { faker } from '@faker-js/faker';
import { INestApplication } from '@nestjs/common';

import { CollectionKind } from '../collection/collection.entity';
import { CollectionService } from '../collection/collection.service';
import { CoinService } from '../sync-chain/coin/coin.service';
import { TierService } from '../tier/tier.service';
import { Plugin } from './plugin.entity';

export const gql = String.raw;

describe('PluginResolver', () => {
    let app: INestApplication;
    let pluginRepository: Repository<Plugin>;
    let coinService: CoinService;
    let collectionService: CollectionService;
    let tierService: TierService;
    let walletService: WalletService;

    beforeAll(async () => {
        app = global.app;
        pluginRepository = global.pluginRepository;
        coinService = global.coinService;
        collectionService = global.collectionService;
        tierService = global.tierService;
        walletService = global.walletService;
    });

    afterEach(async () => {
        await global.clearDatabase();
        global.gc && global.gc();
    });

    describe('#getPlugins', () => {
        it('should work for non-query provided', async () => {
            await pluginRepository.save({
                name: faker.commerce.productName(),
                displayName: faker.commerce.productName(),
                description: faker.commerce.productDescription(),
                author: faker.commerce.department(),
                version: faker.git.commitSha(),
                isPublished: true,
            });

            await pluginRepository.save({
                name: faker.commerce.productName(),
                displayName: faker.commerce.productName(),
                description: faker.commerce.productDescription(),
                author: faker.commerce.department(),
                version: faker.git.commitSha(),
                isPublished: false,
            });

            const query = gql`
                query Plugins($collectionId: String) {
                    plugins(collectionId: $collectionId) {
                        id
                        name
                    }
                }
            `;

            await request(app.getHttpServer())
                .post('/graphql')
                .send({ query })
                .expect(200)
                .expect(({ body }) => {
                    expect(body.data.plugins.length).toEqual(1);
                });
        });

        it('should work if some query provided', async () => {
            const plugin1 = await pluginRepository.save({
                name: faker.commerce.productName(),
                displayName: faker.commerce.productName(),
                description: faker.commerce.productDescription(),
                author: faker.commerce.department(),
                version: faker.git.commitSha(),
                isPublished: true,
            });

            const plugin2 = await pluginRepository.save({
                name: faker.commerce.productName(),
                displayName: faker.commerce.productName(),
                description: faker.commerce.productDescription(),
                author: faker.commerce.department(),
                version: faker.git.commitSha(),
                isPublished: true,
            });

            const coin = await coinService.createCoin({
                address: '0x82af49447d8a07e3bd95bd0d56f35241523fbab1',
                name: 'Wrapped Ether',
                symbol: 'WETH',
                decimals: 18,
                derivedETH: 1,
                derivedUSDC: 1.5,
                enabled: true,
                chainId: 1,
            });

            const simpleCollection = await collectionService.createCollection({
                name: faker.company.name(),
                displayName: 'The best collection',
                about: 'The best collection ever',
                artists: [],
                tags: [],
                kind: CollectionKind.edition,
                address: faker.finance.ethereumAddress(),
            });

            await tierService.createTier({
                name: faker.company.name(),
                totalMints: 100,
                collection: { id: simpleCollection.id },
                price: '100',
                paymentTokenAddress: coin.address,
                tierId: 0,
                metadata: {
                    uses: [plugin2.name],
                },
            });

            await tierService.createTier({
                name: faker.company.name(),
                totalMints: 100,
                collection: { id: simpleCollection.id },
                price: '100',
                paymentTokenAddress: coin.address,
                tierId: 0,
                metadata: {
                    uses: [plugin2.name],
                },
            });

            const complexCollection = await collectionService.createCollection({
                name: faker.company.name(),
                displayName: 'The best collection',
                about: 'The best collection ever',
                artists: [],
                tags: [],
                kind: CollectionKind.edition,
                address: faker.finance.ethereumAddress(),
            });

            await tierService.createTier({
                name: faker.company.name(),
                totalMints: 100,
                collection: { id: complexCollection.id },
                price: '100',
                paymentTokenAddress: coin.address,
                tierId: 0,
                metadata: {
                    uses: [plugin1.name],
                },
            });

            await tierService.createTier({
                name: faker.company.name(),
                totalMints: 100,
                collection: { id: complexCollection.id },
                price: '100',
                paymentTokenAddress: coin.address,
                tierId: 0,
                metadata: {
                    uses: [plugin2.name],
                },
            });

            await tierService.createTier({
                name: faker.company.name(),
                totalMints: 100,
                collection: { id: complexCollection.id },
                price: '100',
                paymentTokenAddress: coin.address,
                tierId: 0,
                metadata: {
                    uses: [plugin1.name, plugin2.name],
                },
            });

            const query = gql`
                query Plugins($collectionId: String) {
                    plugins(collectionId: $collectionId) {
                        id
                        name
                    }
                }
            `;

            const variables1 = { collectionId: simpleCollection.id };

            await request(app.getHttpServer())
                .post('/graphql')
                .send({ query, variables: variables1 })
                .expect(200)
                .expect(({ body }) => {
                    expect(body.data.plugins.length).toEqual(1);
                });

            const variables2 = { collectionId: complexCollection.id };

            return await request(app.getHttpServer())
                .post('/graphql')
                .send({ query, variables: variables2 })
                .expect(200)
                .expect(({ body }) => {
                    expect(body.data.plugins.length).toEqual(2);
                });
        });
    });

    describe('#installOnCollection', () => {
        let coin;
        let collection;
        let tier;
        let tier2;
        let walletEntity;
        let wallet;

        beforeEach(async () => {
            walletEntity = await ethers.Wallet.createRandom();
            wallet = await walletService.createWallet({ address: walletEntity.address });
            coin = await coinService.createCoin({
                address: '0x82af49447d8a07e3bd95bd0d56f35241523fbab1',
                name: 'Wrapped Ether',
                symbol: 'WETH',
                decimals: 18,
                derivedETH: 1,
                derivedUSDC: 1.5,
                enabled: true,
                chainId: 1,
            });

            collection = await collectionService.createCollection({
                name: faker.company.name(),
                displayName: 'The best collection',
                about: 'The best collection ever',
                artists: [],
                tags: [],
                kind: CollectionKind.edition,
                address: faker.finance.ethereumAddress(),
                creator: { id: wallet.id },
            });

            tier = await tierService.createTier({
                name: faker.company.name(),
                totalMints: 100,
                collection: { id: collection.id },
                price: '100',
                paymentTokenAddress: coin.address,
                tierId: 0,
                metadata: {
                    properties: {
                        level: {
                            name: '{{level_name}}',
                            type: 'string',
                            value: '{{level}}',
                            display_value: 'Basic',
                        },
                    },
                },
            });

            tier2 = await tierService.createTier({
                name: faker.company.name(),
                totalMints: 100,
                collection: { id: collection.id },
                price: '1000',
                paymentTokenAddress: coin.address,
                tierId: 1,
                metadata: {
                    properties: {
                        level2: {
                            name: '{{level2_name}}',
                            type: 'string',
                            value: '{{level}}',
                            display_value: 'Basic',
                        },
                    },
                },
            });
        });

        it('should install the plugin on given collection', async () => {
            const message = 'installPluginOnCollection';
            const signature = await walletEntity.signMessage(message);

            const plugin: Plugin = await pluginRepository.save({
                name: faker.commerce.productName(),
                displayName: faker.commerce.productName(),
                description: faker.commerce.productDescription(),
                author: faker.commerce.department(),
                version: faker.git.commitSha(),
            });

            const anotherCollection = await collectionService.createCollection({
                name: faker.company.name(),
                displayName: 'The best collection',
                about: 'The best collection ever',
                artists: [],
                tags: [],
                kind: CollectionKind.edition,
                address: faker.finance.ethereumAddress(),
            });

            await tierService.createTier({
                name: faker.company.name(),
                totalMints: 100,
                collection: { id: anotherCollection.id },
                price: '100',
                paymentTokenAddress: coin.address,
                tierId: 0,
                metadata: {
                    properties: {
                        level: {
                            name: 'level',
                            type: 'string',
                            value: 'basic',
                            display_value: 'Basic',
                        },
                    },
                },
            });

            const tokenQuery = gql`
                mutation CreateSession($input: CreateSessionInput!) {
                    createSession(input: $input) {
                        token
                        wallet {
                            id
                            address
                        }
                    }
                }
            `;

            const tokenVariables = {
                input: {
                    address: wallet.address,
                    message,
                    signature,
                },
            };

            const tokenRs = await request(app.getHttpServer()).post('/graphql').send({ query: tokenQuery, variables: tokenVariables });

            const query = gql`
                mutation InstallOnCollection($input: InstallOnCollectionInput!) {
                    installOnCollection(input: $input) {
                        id
                        metadata
                    }
                }
            `;

            const variables = {
                input: {
                    collectionId: collection.id,
                    pluginId: plugin.id,
                    metadata: {},
                },
            };

            return await request(app.getHttpServer())
                .post('/graphql')
                .auth(tokenRs.body.data.createSession.token, { type: 'bearer' })
                .send({ query, variables })
                .expect(({ body }) => {
                    expect(body.data.installOnCollection.length).toEqual(2);
                    expect(body.data.installOnCollection[0].id).toEqual(tier.id);
                    expect(body.data.installOnCollection[0].metadata.uses[0]).toEqual(plugin.name);
                    expect(body.data.installOnCollection[0].metadata.properties.level).toBeTruthy();
                    expect(body.data.installOnCollection[0].metadata.properties.level2).toBeFalsy();
                    expect(body.data.installOnCollection[1].id).toEqual(tier2.id);
                    expect(body.data.installOnCollection[1].metadata.properties.level).toBeFalsy();
                    expect(body.data.installOnCollection[1].metadata.properties.level2).toBeTruthy();
                });
        });

        it('should install the plugin on given collection with customized name for `metadata.property` object', async () => {
            const message = 'installPluginOnCollection';
            const signature = await walletEntity.signMessage(message);

            const plugin: Plugin = await pluginRepository.save({
                name: faker.commerce.productName(),
                displayName: faker.commerce.productName(),
                description: faker.commerce.productDescription(),
                author: faker.commerce.department(),
                version: faker.git.commitSha(),
                metadata: {
                    properties: {
                        holding_days: {
                            name: '{{holding_days_name}}',
                            type: 'number',
                            value: '{{holding_days}}',
                            display_value: 'none',
                        },
                    },
                    config: {
                        alias: {
                            holding_days_name: 'holding_days_name',
                        },
                    },
                },
            });

            const tokenQuery = gql`
                mutation CreateSession($input: CreateSessionInput!) {
                    createSession(input: $input) {
                        token
                        wallet {
                            id
                            address
                        }
                    }
                }
            `;

            const tokenVariables = {
                input: {
                    address: wallet.address,
                    message,
                    signature,
                },
            };

            const tokenRs = await request(app.getHttpServer()).post('/graphql').send({ query: tokenQuery, variables: tokenVariables });

            const query = gql`
                mutation InstallOnCollection($input: InstallOnCollectionInput!) {
                    installOnCollection(input: $input) {
                        id
                        metadata
                    }
                }
            `;

            const realHoldingDaysName = faker.lorem.word(15);
            const variables = {
                input: {
                    collectionId: collection.id,
                    pluginId: plugin.id,
                    metadata: {
                        conditions: plugin.metadata.conditions,
                        configs: { alias: { holding_days_name: realHoldingDaysName } },
                        properties: plugin.metadata.properties,
                    },
                },
            };

            return await request(app.getHttpServer())
                .post('/graphql')
                .auth(tokenRs.body.data.createSession.token, { type: 'bearer' })
                .send({ query, variables })
                .expect(({ body }) => {
                    expect(body.data.installOnCollection.length).toEqual(2);
                    expect(body.data.installOnCollection[0].id).toEqual(tier.id);
                    expect(body.data.installOnCollection[0].metadata.properties.level).toBeTruthy();
                    expect(body.data.installOnCollection[0].metadata.properties.level2).toBeFalsy();
                    expect(body.data.installOnCollection[0].metadata.properties['holding_days'].name).toEqual(realHoldingDaysName);
                    expect(body.data.installOnCollection[1].id).toEqual(tier2.id);
                    expect(body.data.installOnCollection[1].metadata.properties.level).toBeFalsy();
                    expect(body.data.installOnCollection[1].metadata.properties.level2).toBeTruthy();
                });
        });

        it('should install the plugin on given collection with customized property key for `metadata.property`', async () => {
            const message = 'installPluginOnCollection';
            const signature = await walletEntity.signMessage(message);

            const plugin: Plugin = await pluginRepository.save({
                name: faker.commerce.productName(),
                displayName: faker.commerce.productName(),
                description: faker.commerce.productDescription(),
                author: faker.commerce.department(),
                version: faker.git.commitSha(),
                metadata: {
                    properties: {
                        [`{{holding_days_name}}`]: {
                            name: '{{holding_days_name}}',
                            type: 'number',
                            value: '{{holding_days}}',
                            display_value: 'none',
                        },
                    },
                },
            });

            const tokenQuery = gql`
                mutation CreateSession($input: CreateSessionInput!) {
                    createSession(input: $input) {
                        token
                        wallet {
                            id
                            address
                        }
                    }
                }
            `;

            const tokenVariables = {
                input: {
                    address: wallet.address,
                    message,
                    signature,
                },
            };

            const tokenRs = await request(app.getHttpServer()).post('/graphql').send({ query: tokenQuery, variables: tokenVariables });

            const query = gql`
                mutation InstallOnCollection($input: InstallOnCollectionInput!) {
                    installOnCollection(input: $input) {
                        id
                        metadata
                    }
                }
            `;

            const realHoldingDaysName = faker.lorem.word(15);
            const variables = {
                input: {
                    collectionId: collection.id,
                    pluginId: plugin.id,
                    metadata: {
                        conditions: plugin.metadata.conditions,
                        configs: { alias: { holding_days_name: realHoldingDaysName } },
                        properties: plugin.metadata.properties,
                    },
                },
            };

            return await request(app.getHttpServer())
                .post('/graphql')
                .auth(tokenRs.body.data.createSession.token, { type: 'bearer' })
                .send({ query, variables })
                .expect(({ body }) => {
                    expect(body.data.installOnCollection.length).toEqual(2);
                    expect(body.data.installOnCollection[0].id).toEqual(tier.id);
                    expect(body.data.installOnCollection[0].metadata.properties.level).toBeTruthy();
                    expect(body.data.installOnCollection[0].metadata.properties.level2).toBeFalsy();
                    expect(body.data.installOnCollection[0].metadata.properties[realHoldingDaysName]).toBeTruthy();
                    expect(body.data.installOnCollection[0].metadata.properties[realHoldingDaysName].name).toEqual(realHoldingDaysName);
                    expect(body.data.installOnCollection[0].metadata.properties[`{{holding_days_name}}`]).toBeFalsy();
                    expect(body.data.installOnCollection[1].id).toEqual(tier2.id);
                    expect(body.data.installOnCollection[1].metadata.properties.level).toBeFalsy();
                    expect(body.data.installOnCollection[1].metadata.properties.level2).toBeTruthy();
                });
        });

        it('should install the plugin on given collection with customized plugin name', async () => {
            const message = 'installPluginOnCollection';
            const signature = await walletEntity.signMessage(message);

            const plugin: Plugin = await pluginRepository.save({
                name: faker.commerce.productName(),
                displayName: faker.commerce.productName(),
                description: faker.commerce.productDescription(),
                author: faker.commerce.department(),
                version: faker.git.commitSha(),
                metadata: {
                    properties: {
                        holding_days: {
                            name: '{{holding_days_name}}',
                            type: 'number',
                            value: '{{holding_days}}',
                            display_value: 'none',
                        },
                    },
                },
            });

            const tokenQuery = gql`
                mutation CreateSession($input: CreateSessionInput!) {
                    createSession(input: $input) {
                        token
                        wallet {
                            id
                            address
                        }
                    }
                }
            `;

            const tokenVariables = {
                input: {
                    address: wallet.address,
                    message,
                    signature,
                },
            };

            const tokenRs = await request(app.getHttpServer()).post('/graphql').send({ query: tokenQuery, variables: tokenVariables });

            const query = gql`
                mutation InstallOnCollection($input: InstallOnCollectionInput!) {
                    installOnCollection(input: $input) {
                        id
                        metadata
                    }
                }
            `;

            const customizedPluginName = faker.string.sample();
            const variables = {
                input: {
                    collectionId: collection.id,
                    pluginId: plugin.id,
                    pluginName: customizedPluginName,
                    metadata: {
                        conditions: plugin.metadata.conditions,
                        configs: plugin.metadata.configs,
                        properties: plugin.metadata.properties,
                    },
                },
            };

            return await request(app.getHttpServer())
                .post('/graphql')
                .auth(tokenRs.body.data.createSession.token, { type: 'bearer' })
                .send({ query, variables })
                .expect(({ body }) => {
                    expect(body.data.installOnCollection.length).toEqual(2);
                    expect(body.data.installOnCollection[0].id).toEqual(tier.id);
                    expect(body.data.installOnCollection[0].metadata.uses.length).toEqual(1);
                    expect(body.data.installOnCollection[0].metadata.uses[0]).toEqual(customizedPluginName);
                    expect(body.data.installOnCollection[1].id).toEqual(tier2.id);
                    expect(body.data.installOnCollection[1].metadata.uses.length).toEqual(1);
                    expect(body.data.installOnCollection[1].metadata.uses[0]).toEqual(customizedPluginName);
                });
        });

        it.skip('should forbid if the caller is not the owner of the collection', async () => {
            const anotherWallet = await walletService.createWallet({ address: faker.finance.ethereumAddress() });
            const message = 'follow';
            const signature = await walletEntity.signMessage(message);

            const plugin: Plugin = await pluginRepository.save({
                name: faker.commerce.productName(),
                displayName: faker.commerce.productName(),
                description: faker.commerce.productDescription(),
                author: faker.commerce.department(),
                version: faker.git.commitSha(),
            });

            const anotherCollection = await collectionService.createCollection({
                name: faker.company.name(),
                displayName: 'The best collection',
                about: 'The best collection ever',
                artists: [],
                tags: [],
                kind: CollectionKind.edition,
                address: faker.finance.ethereumAddress(),
                creator: { id: anotherWallet.id },
            });

            await tierService.createTier({
                name: faker.company.name(),
                totalMints: 100,
                collection: { id: anotherCollection.id },
                price: '100',
                paymentTokenAddress: coin.address,
                tierId: 0,
                metadata: {
                    properties: {
                        level: {
                            name: '{{level_name}}',
                            type: 'string',
                            value: '{{basic}}',
                            display_value: 'Basic',
                        },
                    },
                },
            });

            const tokenQuery = gql`
                mutation CreateSession($input: CreateSessionInput!) {
                    createSession(input: $input) {
                        token
                        wallet {
                            id
                            address
                        }
                    }
                }
            `;

            const tokenVariables = {
                input: {
                    address: wallet.address,
                    message,
                    signature,
                },
            };

            const tokenRs = await request(app.getHttpServer()).post('/graphql').send({ query: tokenQuery, variables: tokenVariables });

            const query = gql`
                mutation InstallOnCollection($input: InstallOnCollectionInput!) {
                    installOnCollection(input: $input) {
                        id
                    }
                }
            `;

            const variables = {
                input: {
                    collectionId: anotherCollection.id,
                    pluginId: plugin.id,
                    metadata: {},
                },
            };

            return await request(app.getHttpServer())
                .post('/graphql')
                .auth(tokenRs.body.data.createSession.token, { type: 'bearer' })
                .send({ query, variables })
                .expect(200)
                .expect(({ body }) => {
                    expect(body.errors[0].message).toEqual('Forbidden resource');
                });
        });
    });

    describe('#installOnTier', () => {
        let coin;
        let collection;
        let tier;

        beforeEach(async () => {
            coin = await coinService.createCoin({
                address: '0x82af49447d8a07e3bd95bd0d56f35241523fbab1',
                name: 'Wrapped Ether',
                symbol: 'WETH',
                decimals: 18,
                derivedETH: 1,
                derivedUSDC: 1.5,
                enabled: true,
                chainId: 1,
            });

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
                collection: { id: collection.id },
                price: '100',
                paymentTokenAddress: coin.address,
                tierId: 0,
                metadata: {
                    properties: {
                        level: {
                            name: 'level',
                            type: 'string',
                            value: 'basic',
                            display_value: 'Basic',
                        },
                    },
                },
            });
        });

        // need add auth decorator
        it.skip('should install the plugin on given tier', async () => {
            const plugin: Plugin = await pluginRepository.save({
                name: faker.commerce.productName(),
                displayName: faker.commerce.productName(),
                description: faker.commerce.productDescription(),
                author: faker.commerce.department(),
                version: faker.git.commitSha(),
            });

            const query = gql`
                mutation InstallOnTier($input: InstallOnTierInput!) {
                    installOnTier(input: $input) {
                        id
                    }
                }
            `;
            const variables = {
                input: {
                    tierId: tier.id,
                    pluginId: plugin.id,
                    metadata: {},
                },
            };

            return await request(app.getHttpServer())
                .post('/graphql')
                .send({ query, variables })
                .expect(200)
                .expect(({ body }) => {
                    expect(body.data.installOnTier).toBeTruthy();
                    expect(body.data.installOnTier.id).toEqual(tier.id);
                });
        });
    });
});
