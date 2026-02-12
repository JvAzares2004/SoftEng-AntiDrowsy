import { Controller, Get, Query, Req } from '@nestjs/common';
import { AuditLoggerService } from '../service/audit-logger/audit-logger.service';
import chalk from 'chalk';
import { Request } from 'express';

console.log(chalk.bgGreen.black('[CONTROLLER] Logs controller loaded'));

@Controller('logs')
export class LogsController {
  constructor(private readonly auditLogger: AuditLoggerService) {}

  @Get()
  async getLogs(
    @Query('userId') userId?: string,
    @Query('userType') userType?: 'admin' | 'user',
    @Query('action') action?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    try {
      console.log(chalk.blue('[LOGS] Fetching audit logs with filters:'), {
        userId,
        userType,
        action,
        startDate,
        endDate,
        limit,
        offset,
      });

      const filters: any = {};

      if (userId) filters.userId = userId;
      if (userType) filters.userType = userType;
      if (action) filters.action = action;
      if (startDate) filters.startDate = new Date(startDate);
      if (endDate) filters.endDate = new Date(endDate);
      if (limit) filters.limit = parseInt(limit, 10);
      if (offset) filters.offset = parseInt(offset, 10);

      const logs = await this.auditLogger.getLogs(filters);

      console.log(chalk.green(`[LOGS] Successfully retrieved ${logs.length} audit logs`));

      return {
        success: true,
        logs,
        total: logs.length,
      };
    } catch (error) {
      console.error(chalk.red('[LOGS] Error fetching audit logs:'), error);
      return {
        success: false,
        message: 'Failed to retrieve audit logs',
        error: error.message,
      };
    }
  }

  @Get('stats')
  async getLogStats() {
    try {
      console.log(chalk.blue('[LOGS] Fetching audit log statistics'));

      const stats = await this.auditLogger.getLogStats();

      console.log(chalk.green('[LOGS] Successfully retrieved audit log stats'));

      return {
        success: true,
        stats,
      };
    } catch (error) {
      console.error(chalk.red('[LOGS] Error fetching audit log stats:'), error);
      return {
        success: false,
        message: 'Failed to retrieve audit log statistics',
        error: error.message,
      };
    }
  }
}
