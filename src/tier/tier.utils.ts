import { find, toPairs } from 'lodash';

import { Tier } from './tier.entity';

/**
 * re-render property name for metadata by using `alias` config
 * 
 * @param tiers
 * @returns
 */
export const renderPropertyName = (tier: Tier) => {
    // render the property by alias
    for (const [key, value] of toPairs(tier.metadata?.configs?.alias)) {
        const target = find(toPairs(tier.metadata?.properties), kv => kv[1].name === `{{${key}}}`);
        if (target) tier.metadata.properties[target[0]].name = value;
    }
    // if no alias found and it will be kept as `{{}}`, then use key as default
    for (const [key, propertyObj] of toPairs(tier.metadata?.properties)) {
        if (propertyObj.name?.startsWith('{{') && propertyObj.name?.endsWith('}}')) propertyObj.name = key;
    }
    return tier;
};
