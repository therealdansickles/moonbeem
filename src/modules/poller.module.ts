import { Module } from '@nestjs/common';
import { PollerService } from '../services/poller.service.js';
import { SharedModule } from './share.module.js';

@Module({
    imports: [SharedModule],
    controllers: [],
    providers: [PollerService],
    exports: [PollerService],
})
export class PollerModule {}
