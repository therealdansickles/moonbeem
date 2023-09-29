import {
    filterTokenIdsByRanges,
    generateSlug,
    generateTokenIdsByRanges,
    getCollectionAttributesOverview,
    getCollectionUpgradesOverview,
} from './collection.utils';
import { Tier } from '../tier/tier.entity';

describe('CollectionServiceUtil', () => {
    describe('generateSlug', function () {
        it('should lowercase the name', () => {
            expect(generateSlug('Vibe')).toEqual('vibe');
        });

        it('should replace spaces with dashes', () => {
            expect(generateSlug('he llo wor ld')).toEqual('he-llo-wor-ld');
        });

        it('should remove non-alphanumeric characters', () => {
            expect(generateSlug('&*()he!llo@wo$rld;#')).toEqual('helloworld');
        });
    });

    describe('generateTokenIdsByRanges', () => {
        it('should generate empty array if ranges is empty', function () {
            const result = generateTokenIdsByRanges([]);
            expect(result).toEqual([]);
        });

        it('should generate tokenIds by ranges', () => {
            const result = generateTokenIdsByRanges([
                [1, 5],
                [7, 10],
            ]);
            expect(result).toEqual(['1', '2', '3', '4', '5', '7', '8', '9', '10']);
        });
    });

    describe('filterTokenIdsByRanges', () => {
        it('should return empty array if the tokenIds is out of ranges', function () {
            const result = filterTokenIdsByRanges(['1', '2', '3', '4', '5', '7', '8', '9', '10'], [[11, 20]]);
            expect(result).toEqual([]);
        });

        it('should return filtered tokenIds', () => {
            const result = filterTokenIdsByRanges(
                ['1', '2', '3', '4', '5', '7', '8', '9', '10'],
                [
                    [3, 8],
                    [10, 10],
                ]
            );
            expect(result).toEqual(['3', '4', '5', '7', '8', '10']);
        });
    });

    describe('getCollectionAttributesOverview', () => {
        it('should get the static attributes overview successfully', () => {
            const tierTokenCountsMap = {
                1: 10,
                2: 20,
                3: 100,
            };
            const tier1 = {
                tierId: 1,
                metadata: {
                    properties: {
                        Color: {
                            name: 'Color',
                            type: 'string',
                            value: 'Red',
                        },
                        Height: {
                            name: 'Height',
                            type: 'number',
                            value: 180,
                        },
                    },
                },
            } as unknown as Tier;
            const tier2 = {
                tierId: 2,
                metadata: {
                    properties: {
                        Color: {
                            name: 'Color',
                            type: 'string',
                            value: 'Green',
                        },
                        Height: {
                            name: 'Height',
                            type: 'number',
                            value: 160,
                        },
                    },
                },
            } as unknown as Tier;

            const tier3 = {
                tierId: 3,
                metadata: {
                    properties: {
                        Color: {
                            name: 'Color',
                            type: 'string',
                            value: 'Green',
                        },
                        Type: {
                            name: 'Type',
                            type: 'string',
                            value: 'Golden',
                        },
                        Height: {
                            name: 'Height',
                            type: 'number',
                            value: 190,
                        },
                    },
                },
            } as unknown as Tier;

            const result = getCollectionAttributesOverview([tier1, tier2, tier3], tierTokenCountsMap);
            expect(result.staticAttributes).toEqual([
                {
                    name: 'Color',
                    type: 'string',
                    valueCounts: [
                        {
                            value: 'Red',
                            count: 10,
                        },
                        {
                            value: 'Green',
                            count: 120,
                        },
                    ],
                },
                {
                    name: 'Height',
                    type: 'number',
                    valueCounts: [
                        {
                            value: 180,
                            count: 10,
                        },
                        {
                            value: 160,
                            count: 20,
                        },
                        {
                            value: 190,
                            count: 100,
                        },
                    ],
                },
                {
                    name: 'Type',
                    type: 'string',
                    valueCounts: [
                        {
                            value: 'Golden',
                            count: 100,
                        },
                    ],
                },
            ]);
        });

        it('should get the dynamic attributes overview successfully', () => {
            const tierTokenCountsMap = {
                1: 10,
                2: 20,
                3: 100,
            };
            const tier1 = {
                tierId: 1,
                metadata: {
                    properties: {
                        Color: {
                            name: 'Color',
                            type: 'string',
                            value: 'Red',
                            class: 'upgradable',
                        },
                        Height: {
                            name: 'Height',
                            type: 'number',
                            value: 180,
                            class: 'upgradable',
                        },
                    },
                },
            } as unknown as Tier;
            const tier2 = {
                tierId: 2,
                metadata: {
                    properties: {
                        Color: {
                            name: 'Color',
                            type: 'string',
                            value: 'Green',
                            class: 'upgradable',
                        },
                        Height: {
                            name: 'Height',
                            type: 'number',
                            value: 160,
                            class: 'upgradable',
                        },
                    },
                },
            } as unknown as Tier;

            const tier3 = {
                tierId: 3,
                metadata: {
                    properties: {
                        Color: {
                            name: 'Color',
                            type: 'string',
                            value: 'Green',
                            class: 'upgradable',
                        },
                        Type: {
                            name: 'Type',
                            type: 'string',
                            value: 'Golden',
                        },
                        Height: {
                            name: 'Height',
                            type: 'number',
                            value: 190,
                            class: 'upgradable',
                        },
                    },
                },
            } as unknown as Tier;

            const result = getCollectionAttributesOverview([tier1, tier2, tier3], tierTokenCountsMap);
            expect(result.staticAttributes).toEqual([
                {
                    name: 'Type',
                    type: 'string',
                    valueCounts: [
                        {
                            value: 'Golden',
                            count: 100,
                        },
                    ],
                },
            ]);
            expect(result.dynamicAttributes).toEqual([
                {
                    name: 'Color',
                    type: 'string',
                    class: 'upgradable',
                    valueCounts: [
                        {
                            value: 'Red',
                            count: 10,
                        },
                        {
                            value: 'Green',
                            count: 120,
                        },
                    ],
                },
                {
                    name: 'Height',
                    type: 'number',
                    class: 'upgradable',
                    valueCounts: [
                        {
                            value: 180,
                            count: 10,
                        },
                        {
                            value: 160,
                            count: 20,
                        },
                        {
                            value: 190,
                            count: 100,
                        },
                    ],
                },
            ]);
        });
    });

    describe('getCollectionUpgradesOverview', () => {
        const tierTokenCountsMap = {
            1: 10,
            2: 20,
            3: 100,
        };
        const tier1 = {
            tierId: 1,
            metadata: {
                uses: ['@vibe_lab/loyalty_points', '@vibe_lab/magic_rule_engine', '@vibe_lab/airdrop'],
            },
        } as unknown as Tier;

        const tier2 = {
            tierId: 2,
            metadata: {
                uses: ['@vibe_lab/magic_rule_engine', '@vibe_lab/airdrop'],
            },
        } as unknown as Tier;

        const tier3 = {
            tierId: 3,
            metadata: {
                uses: ['@vibe_lab/loyalty_points', '@vibe_lab/magic_rule_engine'],
            },
        } as unknown as Tier;
        const result = getCollectionUpgradesOverview([tier1, tier2, tier3], tierTokenCountsMap);
        expect(result).toEqual([
            {
                name: '@vibe_lab/loyalty_points',
                count: 110,
            },
            {
                name: '@vibe_lab/magic_rule_engine',
                count: 130,
            },
            {
                name: '@vibe_lab/airdrop',
                count: 30,
            },
        ]);
    });
});
