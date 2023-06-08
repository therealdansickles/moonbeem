import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { faker } from '@faker-js/faker';
import { postgresConfig } from '../../lib/configs/db.config';
import { SystemConfigModule } from './system-config.module';
import { SystemConfigService } from './system-config.service';

describe('SystemConfigService', () => {
    let service: SystemConfigService;

    beforeAll(async () => {
        const module: TestingModule = await Test.createTestingModule({
            imports: [
                TypeOrmModule.forRoot({
                    name: 'sync_chain',
                    type: 'postgres',
                    url: postgresConfig.syncChain.url,
                    autoLoadEntities: true,
                    synchronize: true,
                    logging: false,
                    dropSchema: true,
                }),
                SystemConfigModule,
            ],
        }).compile();

        service = module.get<SystemConfigService>(SystemConfigService);
    });

    afterAll(async () => {
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
            const result = await service.getConfigs();
            expect(result).toBeDefined();
        });
    });
});
