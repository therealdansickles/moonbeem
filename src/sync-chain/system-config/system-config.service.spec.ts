import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { faker } from '@faker-js/faker';
import { postgresConfig } from '../../lib/configs/db.config';
import { SystemConfigModule } from './system-config.module';
import { SystemConfigService } from './system-config.service';
import { SystemConfig } from './system-config.entity';

describe.only('SystemConfigService', () => {
    let repository: Repository<SystemConfig>;
    let service: SystemConfigService;

    beforeAll(async () => {
        const module: TestingModule = await Test.createTestingModule({
            imports: [
                TypeOrmModule.forRoot({
                    name: 'sync_chain',
                    type: 'postgres',
                    host: postgresConfig.syncChain.host,
                    port: postgresConfig.syncChain.port,
                    username: postgresConfig.syncChain.username,
                    password: postgresConfig.syncChain.password,
                    database: postgresConfig.syncChain.database,
                    autoLoadEntities: true,
                    synchronize: true,
                    logging: false,
                    dropSchema: true,
                }),
                SystemConfigModule,
            ],
        }).compile();

        repository = module.get('sync_chain_SystemConfigRepository');
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
