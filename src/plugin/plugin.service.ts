import { Repository } from 'typeorm';

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { Plugin } from './plugin.entity';

@Injectable()
export class PluginService {
    constructor(@InjectRepository(Plugin) private readonly pluginRepository: Repository<Plugin>) {}

    /**
     * Retrieve all plugins
     * @returns
     */
    async getPlugins(): Promise<Plugin[]> {
        return await this.pluginRepository.find();
    }

    /**
     * Retrieve a plugin by id.
     *
     * @param id The id of the plugin to retrieve.
     * @returns The plugin.
     */
    async getPlugin(id: string): Promise<Plugin> {
        return await this.pluginRepository.findOneBy({ id });
    }
}