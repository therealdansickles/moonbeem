import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';

@Injectable()
export class PollerService {
    constructor() {}

    @Cron('0 * * * * *')
    handleCron() {
        console.log(`Schedule Debug: ${Date.now()}`);
    }
}
