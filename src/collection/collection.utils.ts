import { isEmpty, isNil, omitBy } from 'lodash';

import { MetadataPropertyClass } from '../metadata/metadata.entity';
/**
 * Generate a slug from a name
 * - Lowercase
 * - Replace spaces with dashes
 * - Remove non-alphanumeric characters
 * @param name The name to generate a slug from
 */
import { Tier } from '../tier/tier.entity';
import { renderPropertyName } from '../tier/tier.utils';
import { AttributesOverview, UpgradeOverview } from './collection.dto';

export const generateSlug = (name: string) =>
    name
        .toLowerCase()
        .replace(/ /g, '-')
        .replace(/[^\w-]+/g, '');

export const filterTokenIdsByRanges = (tokenIds: string[], ranges: number[][]): string[] => {
    return tokenIds.filter((tokenId) =>
        ranges.find((range) => {
            const [start, end] = range;
            const value = parseInt(tokenId);
            return start <= value && value <= end;
        }),
    );
};

const filterUndefined = (obj: Record<string, any>) => omitBy(obj, isNil);

export const getCollectionAttributesOverview = (tiers: Tier[], tierTokenCountsMap: Record<number, number>): AttributesOverview => {
    const staticAttributes = [];
    const dynamicAttributes = [];

    for (const tierEntity of tiers) {
        const tier = renderPropertyName(tierEntity);
        const tierTokenCount = tierTokenCountsMap[tier.tierId];
        if (!tier.metadata || isEmpty(tier.metadata)) continue;
        const { properties } = tier.metadata;
        for (const [key, property] of Object.entries(properties)) {
            const { name, type, value, display_value, class: propertyClass } = property;
            if (display_value === 'none') continue;
            let attributeOverview;
            if (propertyClass === MetadataPropertyClass.UPGRADABLE) {
                attributeOverview = dynamicAttributes;
            } else {
                attributeOverview = staticAttributes;
            }
            const attributeDetail = attributeOverview.find((attribute) => attribute.name === name);
            if (attributeDetail) {
                const valueCounts = attributeDetail.valueCounts;
                const valueCount = valueCounts.find((item) => item.value === value);
                if (valueCount) {
                    valueCount.count += tierTokenCount;
                } else {
                    valueCounts.push({
                        value,
                        count: tierTokenCount,
                    });
                }
            } else {
                attributeOverview.push(
                    filterUndefined({
                        key,
                        name,
                        type,
                        class: propertyClass,
                        displayValue: display_value,
                        valueCounts: [
                            {
                                value,
                                count: tierTokenCount,
                            },
                        ],
                    }),
                );
            }
        }
    }
    return {
        staticAttributes,
        dynamicAttributes,
    };
};

export const getCollectionUpgradesOverview = (tiers: Tier[], tierTokenCountsMap: Record<number, number>): UpgradeOverview[] => {
    const upgrades = [];
    for (const tierEntity of tiers) {
        const tier = renderPropertyName(tierEntity);
        const tierTokenCount = tierTokenCountsMap[tier.tierId];
        const { uses } = tier.metadata;
        for (const name of uses || []) {
            const upgradeDetail = upgrades.find((upgrade) => upgrade.name === name);
            if (upgradeDetail) {
                upgradeDetail.count += tierTokenCount;
            } else {
                upgrades.push({
                    name,
                    count: tierTokenCount,
                });
            }
        }
    }
    return upgrades;
};
