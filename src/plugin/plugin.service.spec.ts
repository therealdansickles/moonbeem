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

        it('should get plugins by name', async () => {
            await pluginRepository.save({
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

            const result = await pluginService.getPlugins({ name: plugin2.name });
            expect(result.length).toEqual(1);
            expect(result[0].id).toEqual(plugin2.id);
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
                            name: '{{level_name}}',
                            type: 'string',
                            value: '{{level}}',
                            display_value: 'Basic'
                        }
                    },
                    configs: {
                        alias: {
                            level_name: 'level'
                        }
                    }
                }
            });
        });

        it('should work', async () => {
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
                            display_value: 'none',
                            class: 'upgradable'
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
            expect(result.metadata.uses).toBeTruthy();
            expect(result.metadata.uses.length).toEqual(1);
            expect(result.metadata.uses[0]).toEqual(plugin.name);
            expect(result.metadata.conditions).toBeTruthy();
            expect(result.metadata.conditions.rules.length).toEqual(2);
            expect(result.metadata.conditions.trigger.length).toEqual(1);
            expect(result.metadata.configs.alias.level_name).toEqual('level');
        });

        it('should merge the properties of the metadata', async () => {
            const tier = await tierService.createTier({
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
                            value: '{{basic}}',
                            display_value: 'Basic',
                        },
                        holding_days: {
                            name: 'holding_days',
                            type: 'number',
                            value: '{{holding_days}}',
                            display_value: '0',
                        },
                    },
                },
            });
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
                            class: 'upgradable'
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
            expect(result.metadata.properties.holding_days.value).toEqual('{{holding_days}}');
            expect(result.metadata.properties.holding_days.class).toEqual('upgradable');
            expect(result.metadata.properties.level).toBeTruthy();
        });

        it('shouldn\'t update the existed conditions of the metadata', async () => {
            const tier = await tierService.createTier({
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
                                        value: 99,
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
                                        value: 99,
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
                                    every: 99,
                                    unit: 'minutes',
                                },
                            },
                        ],
                    },
                },
            });
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
            expect(result.metadata.conditions.rules.length).toEqual(2);
            const rules = result.metadata.conditions.rules;
            expect(rules.find(rule => rule.property === 'holding_days' && rule.rule === 'greater_than').update[0].value).toEqual(99);
            expect(rules.find(rule => rule.property === 'holding_days' && rule.rule === 'less_than').update[0].value).toEqual(99);
            const trigger = result.metadata.conditions.trigger;
            expect(trigger[0].config.every).toEqual(99);
        });

        it('should allow user to customize the configs', async () => {
            const tier = await tierService.createTier({
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
                            value: '{{basic}}',
                            display_value: 'Basic',
                        },
                        holding_days: {
                            name: '{{holding_days_name}}',
                            type: 'number',
                            value: '{{holding_days}}',
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
                                        value: 99,
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
                                        value: 99,
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
                                    every: 99,
                                    unit: 'minutes',
                                },
                            },
                        ],
                    },
                    configs: {
                        alias: {
                            level_name: 'level'    
                        }
                    }
                },
            });
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
            const result = await pluginService.installOnTier({
                tier,
                plugin,
                customizedMetadataParameters: {
                    configs: {
                        alias: {
                            level_name: 'level11111'
                        }
                    }
                }
            });
            expect(result.metadata.configs.alias.level_name).toEqual('level11111');
            expect(result.metadata.configs.alias.holding_days_name).toBeFalsy();
        });
    });
});
