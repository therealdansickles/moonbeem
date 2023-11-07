import { Repository } from 'typeorm';

import { faker } from '@faker-js/faker';

import { CollectionKind } from '../collection/collection.entity';
import { CollectionService } from '../collection/collection.service';
import { CollectionPluginService } from '../collectionPlugin/collectionPlugin.service';
import { MetadataPropertyClass } from '../metadata/metadata.entity';
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
    let collectionPluginService: CollectionPluginService;

    beforeAll(async () => {
        pluginService = global.pluginService;
        pluginRepository = global.pluginRepository;
        coinService = global.coinService;
        collectionService = global.collectionService;
        tierService = global.tierService;
        collectionPluginService = global.collectionPluginService;
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

        it('should get the plugin even it\'s `isPublish` equals to false', async () => {
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

    describe('#patchPredefined', () => {
        it('should fill out the value', async () => {
            const plugin = await pluginRepository.save({
                name: faker.commerce.productName(),
                displayName: faker.commerce.productName(),
                description: faker.commerce.productDescription(),
                author: faker.commerce.department(),
                version: faker.git.commitSha(),
                tpye: 'plugin',
                metadata: {
                    configs: {
                        token_scope: [
                            {
                                name: '@vibelabs/physical_redemption/[[id]]',
                                tokens: ['10', '11', '12'],
                            },
                        ],
                    },
                    properties: {
                        '{{physical_redemption_name}}': {
                            name: '{{physical_redemption_name}}',
                            type: 'string',
                            class: MetadataPropertyClass.PLUGIN,
                            value: '{{physical_redemption}}',
                            belongs_to: '@vibelabs/physical_redemption/[[id]]',
                            display_value: '0',
                        },
                    },
                },
            });

            const result = await pluginService.patchPredefined([plugin]);
            expect(result).toBeTruthy();
            expect(result[0].metadata.configs.token_scope[0].name.startsWith(
                '@vibelabs/physical_redemption/')).toBeTruthy();
            expect(
                result[0].metadata.configs.token_scope[0].name.endsWith('@vibelabs/physical_redemption/')).toBeFalsy();
            expect(
                result[0].metadata.properties[`{{physical_redemption_name}}`].belongs_to.startsWith(
                    '@vibelabs/physical_redemption/'),
            ).toBeTruthy();
            expect(result[0].metadata.properties[`{{physical_redemption_name}}`].belongs_to.endsWith(
                '@vibelabs/physical_redemption/')).toBeFalsy();
            expect(result[0].metadata.configs.token_scope[0].name).toEqual(
                result[0].metadata.properties[`{{physical_redemption_name}}`].belongs_to);
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
                            display_value: 'Basic',
                        },
                    },
                    configs: {
                        alias: {
                            level_name: 'level',
                        },
                    },
                },
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
                            class: MetadataPropertyClass.UPGRADABLE,
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
                            class: MetadataPropertyClass.UPGRADABLE,
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
            const customizedMetadataParameters = {
                properties: {
                    hello: {
                        name: 'hello',
                        type: 'string',
                        value: 'world',
                    },
                }
            };
            const result = await pluginService.installOnTier({ tier, plugin, customizedMetadataParameters });
            expect(result.metadata.properties.holding_days.value).toEqual('{{holding_days}}');
            expect(result.metadata.properties.holding_days.class).toEqual('upgradable');
            expect(result.metadata.properties.level).toBeTruthy();
            expect(result.metadata.properties.hello.value).toEqual('world');
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
            expect(rules.find(
                (rule) => rule.property === 'holding_days' && rule.rule === 'greater_than').update[0].value).toEqual(
                99);
            expect(rules.find(
                (rule) => rule.property === 'holding_days' && rule.rule === 'less_than').update[0].value).toEqual(99);
            const trigger = result.metadata.conditions.trigger;
            expect(trigger[0].config.every).toEqual(99);
        });

        it('should allow user to customize the configs for property name alias', async () => {
            const tier = await tierService.createTier({
                name: faker.company.name(),
                totalMints: 100,
                collection: { id: collection.id },
                price: '100',
                paymentTokenAddress: coin.address,
                tierId: 0,
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
                        level_name: {
                            name: '{{level_name}}',
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
                            level_name: 'level11111',
                        },
                    },
                },
            });
            expect(result.metadata.configs.alias.level_name).toEqual('level11111');
            expect(result.metadata.configs.alias.holding_days_name).toBeFalsy();
            expect(result.metadata.properties.level_name.name).toEqual('level11111');
        });

        it('should allow user to customize the configs for property key alias', async () => {
            const tier = await tierService.createTier({
                name: faker.company.name(),
                totalMints: 100,
                collection: { id: collection.id },
                price: '100',
                paymentTokenAddress: coin.address,
                tierId: 0,
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
                        [`{{level_name}}`]: {
                            name: '{{level_name}}',
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
            const realLevelName = 'level11111';
            const result = await pluginService.installOnTier({
                tier,
                plugin,
                customizedMetadataParameters: {
                    configs: {
                        alias: {
                            level_name: realLevelName,
                        },
                    },
                },
            });
            expect(result.metadata.configs.alias.level_name).toEqual(realLevelName);
            expect(result.metadata.configs.alias.holding_days_name).toBeFalsy();
            expect(result.metadata.properties[realLevelName]).toBeTruthy();
            expect(result.metadata.properties[realLevelName].name).toEqual(realLevelName);
        });

        it('should allow user to customize the plugin name', async () => {
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
                            level_name: 'level',
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
            const customizedPluginName = faker.lorem.word(20);
            const result = await pluginService.installOnTier({
                tier,
                plugin,
                customizedPluginName,
                customizedMetadataParameters: {
                    configs: {
                        alias: {
                            level_name: 'level11111',
                        },
                    },
                },
            });
            expect(result.metadata.uses[0]).toEqual(customizedPluginName);
        });

        it('should allow pass `collectionPlugin` to set the plugin name', async () => {
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
                            level_name: 'level',
                        },
                    },
                },
            });
            const name = faker.commerce.productName() + '/[[id]]';
            const plugin = await pluginRepository.save({
                name,
                displayName: faker.commerce.productName(),
                description: faker.commerce.productDescription(),
                author: faker.commerce.department(),
                version: faker.git.commitSha(),
                metadata: {
                    configs: {
                        token_scope: [
                            {
                                name,
                                tokens: [],
                            },
                        ],
                    },
                    properties: {
                        holding_days: {
                            name: 'holding_days',
                            type: 'number',
                            value: 0,
                            display_value: '0',
                            belongs_to: name,
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
                    },
                },
            });
            const collectionPlugin = await collectionPluginService.createCollectionPlugin({
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
            });

            const result = await pluginService.installOnTier({
                tier,
                plugin,
                collectionPlugin: { id: collectionPlugin.id },
            });
            expect(result.metadata.uses[0].endsWith(collectionPlugin.id)).toBeTruthy();
            expect(result.metadata.configs.token_scope[0].name.endsWith(collectionPlugin.id)).toBeTruthy();
            expect(result.metadata.properties.holding_days.belongs_to.endsWith(collectionPlugin.id)).toBeTruthy();
        });

        it('should throw an error if install the same plugin multiple times with the same name', async () => {
            let tier = await tierService.createTier({
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
                            level_name: 'level',
                        },
                    },
                },
            });
            const name = faker.commerce.productName();
            const plugin = await pluginRepository.save({
                name,
                displayName: faker.commerce.productName(),
                description: faker.commerce.productDescription(),
                author: faker.commerce.department(),
                version: faker.git.commitSha(),
                metadata: {
                    configs: {
                        token_scope: [
                            {
                                name,
                                tokens: [],
                            },
                        ],
                    },
                    properties: {
                        holding_days: {
                            name: 'holding_days',
                            type: 'number',
                            value: 0,
                            display_value: '0',
                            belongs_to: name,
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
                    },
                },
            });

            await pluginService.installOnTier({
                tier,
                plugin,
            });

            tier = await tierService.getTier({ id: tier.id });
            await expect(
                async () =>
                    await pluginService.installOnTier({
                        tier,
                        plugin,
                    }),
            ).rejects.toThrow(`Can't install ${plugin.name} more than once`);
        });

        it('should allow install the same plugin multiple times with different name', async () => {
            let tier = await tierService.createTier({
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
                            level_name: 'level',
                        },
                    },
                },
            });
            const name = faker.commerce.productName() + '/[[id]]';
            const plugin = await pluginRepository.save({
                name,
                displayName: faker.commerce.productName(),
                description: faker.commerce.productDescription(),
                author: faker.commerce.department(),
                version: faker.git.commitSha(),
                metadata: {
                    configs: {
                        token_scope: [
                            {
                                name,
                                tokens: [],
                            },
                        ],
                    },
                    properties: {
                        holding_days: {
                            name: 'holding_days',
                            type: 'number',
                            value: 0,
                            display_value: '0',
                            belongs_to: name,
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
                    },
                },
            });
            const collectionPlugin1 = await collectionPluginService.createCollectionPlugin({
                collectionId: collection.id,
                pluginId: plugin.id,
                name: faker.lorem.word(25),
                pluginDetail: {
                    properties: {
                        Color: 'red',
                    },
                    recipients: ['1', '2'],
                    filters: {
                        Color: 'red',
                    },
                },
            });

            const result1 = await pluginService.installOnTier({
                tier,
                plugin,
                collectionPlugin: { id: collectionPlugin1.id },
            });
            expect(result1.metadata.uses[0].endsWith(collectionPlugin1.id)).toBeTruthy();
            expect(result1.metadata.configs.token_scope[0].name.endsWith(collectionPlugin1.id)).toBeTruthy();
            expect(result1.metadata.properties.holding_days.belongs_to.endsWith(collectionPlugin1.id)).toBeTruthy();

            tier = await tierService.getTier({ id: tier.id });
            const collectionPlugin2 = await collectionPluginService.createCollectionPlugin({
                collectionId: collection.id,
                pluginId: plugin.id,
                name: faker.lorem.word(20),
                pluginDetail: {
                    properties: {
                        Color: 'red',
                    },
                    recipients: ['1', '2'],
                    filters: {
                        Color: 'red',
                    },
                },
            });

            const result2 = await pluginService.installOnTier({
                tier,
                plugin,
                collectionPlugin: { id: collectionPlugin2.id },
            });
            expect(result2.metadata.uses.filter((name) => name.endsWith(collectionPlugin2.id)).length).toEqual(1);
            expect(result2.metadata.configs.token_scope[1].name.endsWith(collectionPlugin2.id)).toBeTruthy();
            // expect(result2.metadata.properties.holding_days.belongs_to.endsWith(collectionPlugin2.id)).toBeTruthy();
        });
    });
});
