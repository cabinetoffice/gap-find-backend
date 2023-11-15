import { Controller, Get } from '@nestjs/common';

@Controller('health-check')
export class HealthCheckController {
    @Get()
    findAll(): string {
        return 'GAP Backend up';
    }
}
