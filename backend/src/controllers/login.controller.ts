import { Body, Controller, Post } from '@nestjs/common';
import { DatabaseService } from '../service/database/database.service';
import * as bcrypt from 'bcrypt';
import chalk from 'chalk';

console.log(chalk.bgGreen.black('[CONTROLLER] Login controller loaded'));

interface LoginDto {
  email: string;
  password: string;
}

@Controller('auth')
export class LoginController {
  constructor(private readonly dbService: DatabaseService) {}

  @Post('login')
  async login(@Body() body: LoginDto) {
    const client = this.dbService.getClient();

    try {
      let role: 'admin' | 'user' | null = null;
      let user: any = null;

      // 1. Try admin first
      let result = await client.query(
        'SELECT * FROM user_admins WHERE email = $1',
        [body.email],
      );
      
      if (result.rows.length > 0) {
        user = result.rows[0];
        role = 'admin';
        
        // Check if admin account is active
        const status = String(user.status || '').toLowerCase();
        if (status && status !== 'active') {
          return {
            success: false,
            message: 'Admin account is inactive. Please contact support.',
          };
        }
      }

      // 2. If not admin, try user (customer)
      if (!user) {
        result = await client.query(
          'SELECT * FROM user_customers WHERE email = $1',
          [body.email],
        );
        
        if (result.rows.length > 0) {
          user = result.rows[0];
          role = 'user';
        }
      }

      // Check if user exists
      if (!user) {
        console.log(chalk.red(`[AUTH] Login failed - User not found: ${body.email}`));
        return { success: false, message: 'Invalid email or password' };
      }

      // Verify password
      const passwordMatches = await bcrypt.compare(body.password, user.password);
      
      if (!passwordMatches) {
        console.log(chalk.red(`[AUTH] Login failed - Incorrect password for: ${body.email}`));
        return { success: false, message: 'Invalid email or password' };
      }

      console.log(chalk.green(`[AUTH] ${role} login successful: ${user.email}`));

      return {
        success: true,
        role,
        user: {
          id: user.admin_id || user.customer_id,
          email: user.email,
          firstname: user.firstname,
          lastname: user.lastname,
        },
      };
    } catch (err) {
      console.error(chalk.red('[ERROR] Login error:'), err);
      return { success: false, message: 'Login error. Please try again.' };
    }
  }
}
