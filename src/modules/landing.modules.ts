import { Module } from '@nestjs/common';
import { SharedModule } from './share.module.js';
import { LandingService } from '../services/landing.service.js';
import { LandingResolver } from '../resolvers/landing.resolver.js';
import { LandingController } from '../controllers/landing.controller.js';

@Module({
    imports: [SharedModule],
    providers: [LandingService,LandingResolver],
    controllers: [LandingController],
    exports: [],
})
export class LandingModule {}
