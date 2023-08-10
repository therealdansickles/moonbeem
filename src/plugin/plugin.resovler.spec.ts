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
    
    describe('#installOnCollection', () => {
        let coin;
        let collection;
        let tier;
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
                            name: 'level',
                            type: 'string',
                            value: 'basic',
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

            const tokenRs = await request(app.getHttpServer())
                .post('/graphql')
                .send({ query: tokenQuery, variables: tokenVariables });

            const query = gql`
                mutation InstallOnCollection($input: InstallOnCollectionInput!) {
                    installOnCollection(input: $input) {
                        id
                    }
                }
            `;

            const variables = { 
                input: {
                    collectionId: collection.id, pluginId: plugin.id, metadata: {} 
                }
            };

            return await request(app.getHttpServer())
                .post('/graphql')
                .auth(tokenRs.body.data.createSession.token, { type: 'bearer' })
                .send({ query, variables })
                .expect(200)
                .expect(({ body }) => {
                    expect(body.data.installOnCollection.length).toEqual(1);
                    expect(body.data.installOnCollection[0].id).toEqual(tier.id);
                });
        });

        it('should forbid if the caller is not the owner of the collection', async () => {
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
                creator: { id: anotherWallet.id }
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

            const tokenRs = await request(app.getHttpServer())
                .post('/graphql')
                .send({ query: tokenQuery, variables: tokenVariables });

            const query = gql`
                mutation InstallOnCollection($input: InstallOnCollectionInput!) {
                    installOnCollection(input: $input) {
                        id
                    }
                }
            `;

            const variables = { 
                input: {
                    collectionId: anotherCollection.id, pluginId: plugin.id, metadata: {} 
                }
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
                    tierId: tier.id, pluginId: plugin.id, metadata: {} 
                }
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