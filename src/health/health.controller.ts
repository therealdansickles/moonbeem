import { Controller, Get } from '@nestjs/common';
import { Public } from '../session/session.decorator';

@Controller('health')
export class HealthController {
  constructor() {}

  // Health check endpoint
  @Public()
  @Get()
  health(): string {
    return 'OK';
  }
}
