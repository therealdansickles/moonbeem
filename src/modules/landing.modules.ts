import { Module } from '@nestjs/common';
import { SharedModule } from './share.module';
import { LandingService } from '../services/landing.service';
import { LandingResolver } from '../resolvers/landing.resolver';
import { LandingController } from '../controllers/landing.controller';

@Module({
    imports: [SharedModule],
    providers: [LandingService,LandingResolver],
    controllers: [LandingController],
    exports: [],
})
export class LandingModule {}
