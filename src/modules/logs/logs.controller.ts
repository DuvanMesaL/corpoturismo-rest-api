import { Controller, Get, Query, UseGuards, Param } from '@nestjs/common';
import type { LogsService } from './logs.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('logs')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('super_admin', 'admin')
export class LogsController {
  constructor(private readonly logsService: LogsService) {}

  @Get()
  findAll(@Query() query: { page?: number; limit?: number; filters?: any }) {
    const { page = 1, limit = 50, filters } = query;
    return this.logsService.findAll(+page, +limit, filters);
  }

  @Get('user/:userId')
  findByUser(
    @Param('userId') userId: string,
    @Query() query: { page?: number; limit?: number },
  ) {
    const { page = 1, limit = 20 } = query;
    return this.logsService.findByUser(+userId, +page, +limit);
  }

  @Get('action/:action')
  findByAction(
    @Param('action') action: string,
    @Query() query: { page?: number; limit?: number },
  ) {
    const { page = 1, limit = 20 } = query;
    return this.logsService.findByAction(action, +page, +limit);
  }
}
