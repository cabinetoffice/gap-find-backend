import { Controller, Get, Param } from '@nestjs/common';
import { UnsubscribeService } from './unsubscribe.service';

@Controller('unsubscribe')
export class UnsubscribeController {
    constructor(private unsubscribeService: UnsubscribeService) {}

    @Get(':unsubscribeId')
    async findOne(@Param('unsubscribeId') id: string) {
        return this.unsubscribeService.findOneById(id);
    }
}
