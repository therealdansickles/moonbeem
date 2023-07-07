import { Repository } from 'typeorm';

import { faker } from '@faker-js/faker';
import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';

import { postgresConfig } from '../lib/configs/db.config';
import { Plugin } from './plugin.entity';
import { PluginModule } from './plugin.module';
import { PluginService } from './plugin.service';

describe('PluginService', () => {
    let pluginRepository: Repository<Plugin>;
    let pluginService: PluginService;

    beforeAll(async () => {
        const module: TestingModule = await Test.createTestingModule({
            imports: [
                TypeOrmModule.forRoot({
                    type: 'postgres',
                    url: postgresConfig.url,
                    autoLoadEntities: true,
                    synchronize: true,
                    logging: false,
                    dropSchema: true,
                }),
                TypeOrmModule.forRoot({
                    name: 'sync_chain',
                    type: 'postgres',
                    url: postgresConfig.syncChain.url,
                    autoLoadEntities: true,
                    synchronize: true,
                    logging: false,
                    dropSchema: true,
                }),
                PluginModule
            ],
        }).compile();

        pluginRepository = module.get('PluginRepository');
        pluginService = module.get<PluginService>(PluginService);
    })

    describe('#getPlugins', () => {
        it('should get plugins', async () => {
            const plugin1 = await pluginRepository.save({
                name: faker.commerce.productName(),
                displayName: faker.commerce.productName(),
                description: faker.commerce.productDescription(),
                author: faker.commerce.department(),
                version: faker.git.commitSha(),
                isPublish: false
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
            expect(plugins[0].id).toEqual(plugin2.id)
        })
    });

    describe('#getPluginById', () => {
        it('should get the plugin', async () => {
            const plugin = await pluginRepository.save({
                name: faker.commerce.productName(),
                displayName: faker.commerce.productName(),
                description: faker.commerce.productDescription(),
                author: faker.commerce.department(),
                version: faker.git.commitSha()
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
                isPublish: false
            });

            const result = await pluginService.getPlugin(plugin.id);
            expect(result).toBeTruthy();
            expect(result.author).toEqual(plugin.author);
        });
    });

    
})