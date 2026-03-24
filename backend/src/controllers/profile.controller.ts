import { Body, Controller, Get, Post, Query, Req } from '@nestjs/common';
import { DatabaseService } from '../service/database/database.service';
import { AuditLoggerService } from '../service/audit-logger/audit-logger.service';
import * as bcrypt from 'bcrypt';
import chalk from 'chalk';
import type { Request } from 'express';
import { Client } from 'pg';

console.log(chalk.bgGreen.black('[CONTROLLER] Profile controller loaded'));

@Controller('auth')
export class ProfileController {
  constructor(
    private readonly dbService: DatabaseService,
    private readonly auditLogger: AuditLoggerService,
  ) {}

  @Get('profile')
  async getProfile(@Query('email') email: string, @Query('role') role: string) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const client: Client = this.dbService.getClient();

    try {
      if (role === 'admin') {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
        const result = await client.query(
          'SELECT admin_id as id, firstname, lastname, email, contact_number, LENGTH(password) as password_length FROM user_admins WHERE email = $1',
          [email],
        );

        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        if (result.rows.length === 0) {
          return { success: false, message: 'Profile not found' };
        }

        return {
          success: true,
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
          profile: result.rows[0],
        };
      } else {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
        const result = await client.query(
          'SELECT customer_id as id, firstname, lastname, email, contact_number, LENGTH(password) as password_length FROM user_customers WHERE email = $1',
          [email],
        );

        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        if (result.rows.length === 0) {
          return { success: false, message: 'Profile not found' };
        }

        return {
          success: true,
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
          profile: result.rows[0],
        };
      }
    } catch (error) {
      console.error(chalk.red('[ERROR] Fetching profile:'), error);
      return { success: false, message: 'Error fetching profile' };
    }
  }

  @Post('update-profile')
  async updateProfile(
    @Body()
    body: {
      email: string;
      role: string;
      field: string;
      value: string;
      password?: string;
    },
    @Req() req: Request,
  ) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const client: Client = this.dbService.getClient();

    try {
      const { email, role, field, value, password } = body;

      // Get current user to verify password if needed
      const table = role === 'admin' ? 'user_admins' : 'user_customers';
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      const userResult = await client.query(
        `SELECT * FROM ${table} WHERE email = $1`,
        [email],
      );

      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      if (userResult.rows.length === 0) {
        return { success: false, message: 'User not found' };
      }

      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
      const user = userResult.rows[0];

      // If changing password, verify current password
      if (field === 'password' && password) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access
        const passwordMatches = await bcrypt.compare(password, user.password);
        if (!passwordMatches) {
          return { success: false, message: 'Current password is incorrect' };
        }

        // Hash new password
        const hashedPassword = await bcrypt.hash(value, 10);
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
        await client.query(
          `UPDATE ${table} SET password = $1, updated_at = CURRENT_TIMESTAMP WHERE email = $2`,
          [hashedPassword, email],
        );

        console.log(
          chalk.green(`[AUTH] Password updated for ${role}: ${email}`),
        );

        // Log the password update action
        await this.auditLogger.log({
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
          userId: user.admin_id || user.customer_id,
          userType: role as 'admin' | 'user',
          userEmail: email,
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
          userName: `${user.firstname} ${user.lastname}`,
          action: 'UPDATE_PASSWORD',
          ipAddress: req.ip,
          userAgent: req.headers['user-agent'],
        });

        return {
          success: true,
          message: 'Password updated successfully',
        };
      }

      // Update other fields
      const allowedFields = ['firstname', 'lastname', 'contact_number'];
      if (!allowedFields.includes(field)) {
        return { success: false, message: 'Invalid field' };
      }

      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      await client.query(
        `UPDATE ${table} SET ${field} = $1, updated_at = CURRENT_TIMESTAMP WHERE email = $2`,
        [value, email],
      );

      console.log(chalk.green(`[AUTH] ${field} updated for ${role}: ${email}`));

      // Log the profile update action
      await this.auditLogger.log({
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
        userId: user.admin_id || user.customer_id,
        userType: role as 'admin' | 'user',
        userEmail: email,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        userName: `${user.firstname} ${user.lastname}`,
        action: 'UPDATE_PROFILE',
        details: `Updated ${field}`,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      });

      return {
        success: true,
        message: `${field} updated successfully`,
      };
    } catch (error) {
      console.error(chalk.red('[ERROR] Updating profile:'), error);
      return { success: false, message: 'Error updating profile' };
    }
  }

  @Get('users/statistics')
  async getUsersStatistics() {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const client: Client = this.dbService.getClient();

    try {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      const result = await client.query(`
        SELECT
          customer_id,
          firstname,
          lastname,
          email,
          contact_number,
          date_created
        FROM user_customers
        ORDER BY date_created DESC
      `);

      console.log(
        chalk.green(
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
          `[ADMIN] Retrieved statistics for ${result.rows.length} users`,
        ),
      );

      return {
        success: true,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
        users: result.rows,
      };
    } catch (error) {
      console.error(chalk.red('[ERROR] Fetching user statistics:'), error);
      return {
        success: false,
        message: 'Error fetching user statistics',
        users: [],
      };
    }
  }
}
