import { Repository } from 'typeorm';

import { faker } from '@faker-js/faker';

import { CollectionKind } from '../collection/collection.entity';
import { CollectionService } from '../collection/collection.service';
import { CoinService } from '../sync-chain/coin/coin.service';
import { TierService } from '../tier/tier.service';
import { Plugin } from './plugin.entity';
import { PluginService } from './plugin.service';

describe('PluginService', () => {
    let pluginRepository: Repository<Plugin>;
    let pluginService: PluginService;
    let coinService: CoinService;
    let collectionService: CollectionService;
    let tierService: TierService;

    beforeAll(async () => {
        pluginService = global.pluginService;
        pluginRepository = global.pluginRepository;
        coinService = global.coinService;
        collectionService = global.collectionService;
        tierService = global.tierService;
    });

    afterEach(async () => {
        await global.clearDatabase();
        global.gc && global.gc();
    });

    describe('#getPlugins', () => {
        it('should get plugins', async () => {
            await pluginRepository.save({
                name: faker.commerce.productName(),
                displayName: faker.commerce.productName(),
                description: faker.commerce.productDescription(),
                author: faker.commerce.department(),
                version: faker.git.commitSha(),
                isPublished: false,
            });

            const plugin2 = await pluginRepository.save({
                name: faker.commerce.productName(),
                displayName: faker.commerce.productName(),
                description: faker.commerce.productDescription(),
                author: faker.commerce.department(),
                version: faker.git.commitSha(),
            });

            const plugins = await pluginService.getPlugins();
            expect(plugins.length).toEqual(1);
            expect(plugins[0].id).toEqual(plugin2.id);
        });
    });

    describe('#getPluginById', () => {
        it('should get the plugin', async () => {
            const plugin = await pluginRepository.save({
                name: faker.commerce.productName(),
                displayName: faker.commerce.productName(),
                description: faker.commerce.productDescription(),
                author: faker.commerce.department(),
                version: faker.git.commitSha(),
            });

            const result = await pluginService.getPlugin(plugin.id);
            expect(result).toBeTruthy();
            expect(result.author).toEqual(plugin.author);
        });

        it("should get the plugin even it's `isPublish` equals to false", async () => {
            const plugin = await pluginRepository.save({
                name: faker.commerce.productName(),
                displayName: faker.commerce.productName(),
                description: faker.commerce.productDescription(),
                author: faker.commerce.department(),
                version: faker.git.commitSha(),
                isPublished: false,
            });

            const result = await pluginService.getPlugin(plugin.id);
            expect(result).toBeTruthy();
            expect(result.author).toEqual(plugin.author);
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

        it.skip('should work', async () => {
            const plugin = await pluginRepository.save({
                name: faker.commerce.productName(),
                displayName: faker.commerce.productName(),
                description: faker.commerce.productDescription(),
                author: faker.commerce.department(),
                version: faker.git.commitSha(),
                metadata: {
                    properties: {
                        holding_days: {
                            name: 'holding_days',
                            type: 'number',
                            value: 0,
                            display_value: '0',
                        },
                    },
                    conditions: {
                        operator: 'and',
                        rules: [
                            {
                                property: 'holding_days',
                                rule: 'greater_than',
                                value: -1,
                                update: [
                                    {
                                        property: 'holding_days',
                                        action: 'increase',
                                        value: 1,
                                    },
                                ],
                            },
                            {
                                property: 'holding_days',
                                rule: 'less_than',
                                value: 999,
                                update: [
                                    {
                                        property: 'holding_days',
                                        action: 'increase',
                                        value: 1,
                                    },
                                ],
                            },
                        ],
                        trigger: [
                            {
                                type: 'schedule',
                                updatedAt: new Date().toISOString(),
                                config: {
                                    startAt: new Date().toISOString(),
                                    endAt: new Date().toISOString(),
                                    every: 1,
                                    unit: 'minutes',
                                },
                            },
                        ],
                    },
                },
            });
            const result = await pluginService.installOnTier({ tier, plugin });
            expect(result.metadata.conditions).toBeTruthy();
            expect(result.metadata.conditions.rules.length).toEqual(2);
            expect(result.metadata.conditions.trigger.length).toEqual(1);
        });
    });
});
