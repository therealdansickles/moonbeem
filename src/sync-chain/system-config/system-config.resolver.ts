import { Args, Int, Query, Resolver } from '@nestjs/graphql';
import { Public } from '../../lib/decorators/public.decorator';
import { SystemConfigService } from './system-config.service';
import { SystemConfig } from './system-config.dto';

@Resolver('SystemConfig')
export class SystemConfigResolver {
    constructor(private readonly systemConfigService: SystemConfigService) {}

    @Public()
    @Query(() => SystemConfig, { description: 'returns config for a given uuid' })
    async config(@Args('id') id: string): Promise<SystemConfig> {
        return await this.systemConfigService.getConfig(id);
    }

    @Public()
    @Query(() => [SystemConfig], { description: 'returns config for a given uuid' })
    async configs(@Args('chainId', { type: () => Int!, nullable: true }) chainId?: number): Promise<SystemConfig[]> {
        return await this.systemConfigService.getConfigs(chainId);
    }
}
