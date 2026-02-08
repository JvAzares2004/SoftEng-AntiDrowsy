import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { DatabaseService } from '../service/database/database.service';
import * as bcrypt from 'bcrypt';
import chalk from 'chalk';

console.log(chalk.bgGreen.black('[CONTROLLER] Profile controller loaded'));

@Controller('auth')
export class ProfileController {
  constructor(private readonly dbService: DatabaseService) {}

  @Get('profile')
  async getProfile(@Query('email') email: string, @Query('role') role: string) {
    const client = this.dbService.getClient();

    try {
      if (role === 'admin') {
        const result = await client.query(
          'SELECT admin_id as id, firstname, lastname, email, contact_number, LENGTH(password) as password_length FROM user_admins WHERE email = $1',
          [email],
        );

        if (result.rows.length === 0) {
          return { success: false, message: 'Profile not found' };
        }

        return {
          success: true,
          profile: result.rows[0],
        };
      } else {
        const result = await client.query(
          'SELECT customer_id as id, firstname, lastname, email, contact_number, LENGTH(password) as password_length FROM user_customers WHERE email = $1',
          [email],
        );

        if (result.rows.length === 0) {
          return { success: false, message: 'Profile not found' };
        }

        return {
          success: true,
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
  ) {
    const client = this.dbService.getClient();

    try {
      const { email, role, field, value, password } = body;

      // Get current user to verify password if needed
      const table = role === 'admin' ? 'user_admins' : 'user_customers';
      const userResult = await client.query(
        `SELECT * FROM ${table} WHERE email = $1`,
        [email],
      );

      if (userResult.rows.length === 0) {
        return { success: false, message: 'User not found' };
      }

      const user = userResult.rows[0];

      // If changing password, verify current password
      if (field === 'password' && password) {
        const passwordMatches = await bcrypt.compare(
          password,
          user.password,
        );
        if (!passwordMatches) {
          return { success: false, message: 'Current password is incorrect' };
        }

        // Hash new password
        const hashedPassword = await bcrypt.hash(value, 10);
        await client.query(
          `UPDATE ${table} SET password = $1, updated_at = CURRENT_TIMESTAMP WHERE email = $2`,
          [hashedPassword, email],
        );

        console.log(
          chalk.green(`[AUTH] Password updated for ${role}: ${email}`),
        );
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

      await client.query(
        `UPDATE ${table} SET ${field} = $1, updated_at = CURRENT_TIMESTAMP WHERE email = $2`,
        [value, email],
      );

      console.log(
        chalk.green(`[AUTH] ${field} updated for ${role}: ${email}`),
      );
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
    const client = this.dbService.getClient();

    try {
      const result = await client.query(`
        SELECT 
          c.customer_id,
          c.firstname,
          c.lastname,
          c.email,
          c.contact_number,
          c.monthly_triggers,
          c.successful_triggers,
          c.failed_triggers,
          c.date_created,
          COUNT(t.trigger_id) as total_trigger_records
        FROM user_customers c
        LEFT JOIN triggers t ON c.customer_id = t.customer_id
        GROUP BY c.customer_id, c.firstname, c.lastname, c.email, c.contact_number, 
                 c.monthly_triggers, c.successful_triggers, c.failed_triggers, c.date_created
        ORDER BY c.date_created DESC
      `);

      console.log(chalk.green(`[ADMIN] Retrieved statistics for ${result.rows.length} users`));

      return {
        success: true,
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
