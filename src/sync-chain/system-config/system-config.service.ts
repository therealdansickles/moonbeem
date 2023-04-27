import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Injectable } from '@nestjs/common';
import { SystemConfig } from './system-config.entity';

@Injectable()
export class SystemConfigService {
    constructor(
        @InjectRepository(SystemConfig, 'sync_chain') private readonly systemConfigRepository: Repository<SystemConfig>
    ) {}

    async createConfig(data: any): Promise<SystemConfig> {
        return await this.systemConfigRepository.save(data);
    }

    async getConfig(id: string): Promise<SystemConfig> {
        return await this.systemConfigRepository.findOneBy({ id });
    }
}
