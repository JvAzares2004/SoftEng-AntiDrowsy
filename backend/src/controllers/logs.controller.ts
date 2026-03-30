import { Controller, Get, Query } from '@nestjs/common';
import { AuditLoggerService } from '../service/audit-logger/audit-logger.service';
import chalk from 'chalk';

console.log(chalk.bgGreen.black('[CONTROLLER] Logs controller loaded'));

interface LogFilters {
  userId?: string;
  userType?: 'admin' | 'user';
  action?: string;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}

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

      const filters: LogFilters = {};

      if (userId) filters.userId = userId;
      if (userType) filters.userType = userType;
      if (action) filters.action = action;
      if (startDate) filters.startDate = new Date(startDate);
      if (endDate) filters.endDate = new Date(endDate);
      if (limit) filters.limit = parseInt(limit, 10);
      if (offset) filters.offset = parseInt(offset, 10);

      const logs = (await this.auditLogger.getLogs(filters)) as any[];

      // eslint-disable-next-line prettier/prettier
      console.log(chalk.green(`[LOGS] Successfully retrieved ${logs.length} audit logs`));

      return {
        success: true,
        logs,
        total: logs.length,
      };
    } catch (error) {
      console.error(chalk.red('[LOGS] Error fetching audit logs:'), error);
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      return {
        success: false,
        message: 'Failed to retrieve audit logs',
        error: errorMessage,
      };
    }
  }

  @Get('stats')
  async getLogStats() {
    try {
      console.log(chalk.blue('[LOGS] Fetching audit log statistics'));

      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const stats = await this.auditLogger.getLogStats();

      console.log(chalk.green('[LOGS] Successfully retrieved audit log stats'));

      return {
        success: true,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        stats,
      };
    } catch (error) {
      console.error(chalk.red('[LOGS] Error fetching audit log stats:'), error);
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      return {
        success: false,
        message: 'Failed to retrieve audit log statistics',
        error: errorMessage,
      };
    }
  }
}
