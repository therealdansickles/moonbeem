/**
 * Generate a slug from a name
 * - Lowercase
 * - Replace spaces with dashes
 * - Remove non-alphanumeric characters
 * @param name The name to generate a slug from
 */
import { Tier } from '../tier/tier.entity';
import { renderPropertyName } from '../tier/tier.utils';
import { MetadataPropertyClass } from '../metadata/metadata.entity';
import { AttributesOverview, UpgradeOverview } from './collection.dto';
import { isNil, omitBy } from 'lodash';

export const generateSlug = (name: string) =>
    name
        .toLowerCase()
        .replace(/ /g, '-')
        .replace(/[^\w-]+/g, '');

/**
 * Generate token ids by ranges.
 * The range should be in the format of [start, end] and the start should be less than the end.
 * The start and end should be positive integers.
 * @param ranges The ranges to generate token ids
 * @private
 */
export const generateTokenIdsByRanges = (ranges: number[][]): string[] =>
    ranges
        .map((range) => {
            const [start, end] = range;
            if (start > end || start < 0 || end < 0) {
                throw new Error(`Invalid range`);
            }
            return Array.from({ length: end - start + 1 }, (_, i) => i + start);
        })
        .flat()
        .map((tokenId) => tokenId.toString());

export const filterTokenIdsByRanges = (tokenIds: string[], ranges: number[][]): string[] => {
    return tokenIds.filter((tokenId) =>
        ranges.find((range) => {
            const [start, end] = range;
            const value = parseInt(tokenId);
            return start <= value && value <= end;
        })
    );
};

export const combineTokenIdsAndRanges = (tokenIds: string[], ranges: number[][]): string[] => Array.from(
    new Set([...tokenIds, ...generateTokenIdsByRanges(ranges)])).sort((a, b) => parseInt(a) - parseInt(b));

const filterUndefined = (obj: Record<string, any>) => omitBy(obj, isNil);

export const getCollectionAttributesOverview = (tiers: Tier[], tierTokenCountsMap: Record<number, number>): AttributesOverview => {
    const staticAttributes = [];
    const dynamicAttributes = [];

    for (const tierEntity of tiers) {
        const tier = renderPropertyName(tierEntity);
        const tierTokenCount = tierTokenCountsMap[tier.tierId];
        if (!tier.metadata) continue;
        const { properties } = tier.metadata;
        for (const [_, property] of Object.entries(properties)) {
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
                    })
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
