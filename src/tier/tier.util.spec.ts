import { faker } from '@faker-js/faker';

import { Tier } from './tier.entity';
import { renderPropertyName } from './tier.utils';

describe('renderPropertyName', () => {
    it('should replace the property.name with alias config', async () => {
        const propertyKey = faker.string.sample(10);
        const anotherPropertyKey = faker.string.sample(8);
        const tier = {
            totalMints: 200,
            tierId: 1,
            collection: { id: faker.string.uuid() },
            metadata: {
                configs: {
                    alias: {
                        [propertyKey]: faker.string.uuid()
                    }
                },
                properties: {
                    [propertyKey]: {
                        name: `{{${propertyKey}}}`,
                        value: faker.number.int(10)
                    },
                    [anotherPropertyKey]: {
                        name: `{{${anotherPropertyKey}_name}}`,
                        value: faker.number.int(8)
                    }
                }
            }
        };
        const result = renderPropertyName(tier as Tier);
        expect(result.metadata.properties[propertyKey].name).toEqual(tier.metadata.configs.alias[propertyKey]);
        expect(result.metadata.properties[anotherPropertyKey].name).toEqual(anotherPropertyKey);
    });
});