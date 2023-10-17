import { Query, Resolver } from '@nestjs/graphql';
import { AnalyticsService } from './analytics.service';
import { PlatformStats } from './analytics.dto';
import { VibeEmailGuard } from '../session/session.guard';
import { UseGuards } from '@nestjs/common';

@Resolver(() => PlatformStats)
export class AnalyticsResolver {
    constructor(private readonly analyticsService: AnalyticsService) {}

    @UseGuards(VibeEmailGuard)
    @Query(() => PlatformStats)
    async analytics(): Promise<PlatformStats> {
        return this.analyticsService.getPlatformStats();
    }
}
