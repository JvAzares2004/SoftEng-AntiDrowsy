import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import chalk from 'chalk';

console.log(chalk.bgBlue.black('[SERVICE] Audit Logger service loaded'));

interface AuditLogData {
  userId: string;
  userType: 'admin' | 'user';
  userEmail: string;
  userName: string;
  action: string;
  details?: string;
  ipAddress?: string;
  userAgent?: string;
}

@Injectable()
export class AuditLoggerService {
  constructor(private readonly dbService: DatabaseService) {}

  async log(data: AuditLogData): Promise<void> {
    const client = this.dbService.getClient();
    
    try {
      await client.query(
        `INSERT INTO audit_logs 
         (user_id, user_type, user_email, user_name, action, details, ip_address, user_agent)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          data.userId,
          data.userType,
          data.userEmail,
          data.userName,
          data.action,
          data.details || null,
          data.ipAddress || null,
          data.userAgent || null,
        ],
      );
      
      console.log(chalk.blue(`[AUDIT] Logged action: ${data.action} by ${data.userName} (${data.userEmail})`));
    } catch (error) {
      console.error(chalk.red('[AUDIT] Error logging action:'), error);
      // Don't throw error - logging failure shouldn't break the main operation
    }
  }

  async getLogs(filters?: {
    userId?: string;
    userType?: 'admin' | 'user';
    action?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
    offset?: number;
  }): Promise<any> {
    const client = this.dbService.getClient();
    
    try {
      let query = 'SELECT * FROM audit_logs WHERE 1=1';
      const params: any[] = [];
      let paramCounter = 1;

      if (filters?.userId) {
        query += ` AND user_id = $${paramCounter}`;
        params.push(filters.userId);
        paramCounter++;
      }

      if (filters?.userType) {
        query += ` AND user_type = $${paramCounter}`;
        params.push(filters.userType);
        paramCounter++;
      }

      if (filters?.action) {
        query += ` AND action = $${paramCounter}`;
        params.push(filters.action);
        paramCounter++;
      }

      if (filters?.startDate) {
        query += ` AND created_at >= $${paramCounter}`;
        params.push(filters.startDate);
        paramCounter++;
      }

      if (filters?.endDate) {
        query += ` AND created_at <= $${paramCounter}`;
        params.push(filters.endDate);
        paramCounter++;
      }

      query += ' ORDER BY created_at DESC';

      if (filters?.limit) {
        query += ` LIMIT $${paramCounter}`;
        params.push(filters.limit);
        paramCounter++;
      }

      if (filters?.offset) {
        query += ` OFFSET $${paramCounter}`;
        params.push(filters.offset);
        paramCounter++;
      }

      const result = await client.query(query, params);
      
      console.log(chalk.blue(`[AUDIT] Retrieved ${result.rows.length} log entries`));
      
      return result.rows;
    } catch (error) {
      console.error(chalk.red('[AUDIT] Error retrieving logs:'), error);
      throw error;
    }
  }

  async getLogStats(): Promise<any> {
    const client = this.dbService.getClient();
    
    try {
      const result = await client.query(`
        SELECT 
          COUNT(*) as total_logs,
          COUNT(DISTINCT user_id) as unique_users,
          action,
          COUNT(*) as action_count
        FROM audit_logs
        GROUP BY action
        ORDER BY action_count DESC
      `);
      
      return result.rows;
    } catch (error) {
      console.error(chalk.red('[AUDIT] Error retrieving log stats:'), error);
      throw error;
    }
  }
}
