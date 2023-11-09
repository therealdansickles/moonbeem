import { Query, ResolveField, Resolver } from '@nestjs/graphql';
import { AnalyticsService } from './analytics.service';
import { PlatformData, PlatformStats } from './analytics.dto';
import { Public } from '../session/session.decorator';


@Resolver(() => PlatformStats)
export class AnalyticsResolver {
    constructor(private readonly analyticsService: AnalyticsService) {
    }

    @Public()
    @Query(() => PlatformStats)
    async analytics(): Promise<PlatformStats> {
        return this.analyticsService.getPlatformStats();
    }

    @ResolveField(() => PlatformData, { description: 'Get platform data.' })
    async platformData(): Promise<PlatformData> {
        return this.analyticsService.getPlatformData();
    }
}
