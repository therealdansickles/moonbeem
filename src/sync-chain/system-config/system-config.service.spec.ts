import { faker } from '@faker-js/faker';
import { SystemConfigService } from './system-config.service';

describe('SystemConfigService', () => {
    let service: SystemConfigService;

    beforeAll(async () => {
        service = global.systemConfigService;
    });

    afterEach(async () => {
        await global.clearDatabase();
        global.gc && global.gc();
    });

    describe('system config', () => {
        it('should get an config', async () => {
            const config = await service.createConfig({
                name: faker.company.name(),
                value: faker.random.numeric(5),
                kind: 'string',
                comment: 'The Config Comment',
            });

            const result = await service.getConfig(config.id);
            expect(result.id).toEqual(config.id);
        });
    });

    describe('getSystemConfigs', () => {
        it('should be return config list', async () => {
            await service.createConfig({
                name: faker.company.name(),
                value: faker.random.numeric(5),
                kind: 'string',
                comment: 'The Config Comment',
            });

            const result = await service.getConfigs();
            expect(result).toBeDefined();
        });
    });
});
