import { Controller, Get } from '@nestjs/common';

@Controller('health-check')
export class HealthCheckController {
    constructor() {}
    @Get()
    findAll(): string {
        return 'GAP Backend up';
    }
}
