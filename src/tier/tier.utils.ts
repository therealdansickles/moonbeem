import { find, toPairs } from 'lodash';

import { Tier } from './tier.entity';

/**
 * re-render property name for metadata by using `alias` config
 * 
 * @param tiers
 * @returns
 */
export const renderPropertyName = (tier: Tier) => {
    for (const [key, value] of toPairs(tier.metadata?.configs?.alias)) {
        const target = find(toPairs(tier.metadata?.properties), kv => kv[1].name === `{{${key}}}`);
        tier.metadata.properties[target[0]].name = value;
    }
    return tier;
};