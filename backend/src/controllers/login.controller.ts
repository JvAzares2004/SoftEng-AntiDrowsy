import { Body, Controller, Post, Req } from '@nestjs/common';
import { DatabaseService } from '../service/database/database.service';
import { EmailService } from '../service/email/email.service';
import { AuditLoggerService } from '../service/audit-logger/audit-logger.service';
import * as bcrypt from 'bcrypt';
import chalk from 'chalk';
import type { Request } from 'express';

console.log(chalk.bgGreen.black('[CONTROLLER] Login controller loaded'));

interface LoginDto {
  email: string;
  password: string;
}

interface Verify2FADto {
  email: string;
  code: string;
}

@Controller('auth')
export class LoginController {
  constructor(
    private readonly dbService: DatabaseService,
    private readonly emailService: EmailService,
    private readonly auditLogger: AuditLoggerService,
  ) {}

  @Post('login')
  async login(@Body() body: LoginDto, @Req() req: Request) {
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

        // For admins, verify password first then send 2FA code
        const passwordMatches = await bcrypt.compare(body.password, user.password);
        
        if (!passwordMatches) {
          console.log(chalk.red(`[AUTH] Login failed - Incorrect password for admin: ${body.email}`));
          return { success: false, message: 'Invalid email or password' };
        }

        // Generate and send 2FA code
        const code = await this.emailService.sendVerification(user.email);
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

        console.log(chalk.blue(`[AUTH] Generated code: ${code} for ${user.email}`));
        console.log(chalk.blue(`[AUTH] Code expires at: ${expiresAt.toISOString()}`));

        // Store 2FA code in database
        await client.query(
          `INSERT INTO verification_codes (email, code, is_customer, expires_at)
           VALUES ($1, $2, $3, $4)
           ON CONFLICT (email) 
           DO UPDATE SET code = $2, is_customer = $3, expires_at = $4, created_at = CURRENT_TIMESTAMP`,
          [user.email, code, false, expiresAt],
        );

        console.log(chalk.yellow(`[AUTH] 2FA code sent to admin: ${user.email}`));

        return {
          success: false,
          require2FA: true,
          message: 'Please check your email for the verification code',
        };
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

      // Log the login action
      await this.auditLogger.log({
        userId: user.admin_id || user.customer_id,
        userType: role as 'admin' | 'user',
        userEmail: user.email,
        userName: `${user.firstname} ${user.lastname}`,
        action: 'LOGIN',
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      });

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

  @Post('verify-2fa')
  async verify2FA(@Body() body: Verify2FADto, @Req() req: Request) {
    const client = this.dbService.getClient();

    try {
      console.log(chalk.blue(`[AUTH] Verifying 2FA for: ${body.email}, code: ${body.code}`));

      // Debug: Check all records for this email
      const debugResult = await client.query(
        'SELECT * FROM verification_codes WHERE email = $1',
        [body.email],
      );
      
      console.log(chalk.blue(`[AUTH] All records for ${body.email}:`), debugResult.rows);

      // Retrieve the verification code from database
      const result = await client.query(
        'SELECT * FROM verification_codes WHERE email = $1 AND is_customer = false',
        [body.email],
      );

      console.log(chalk.blue(`[AUTH] Found ${result.rows.length} records for ${body.email}`));
      
      if (result.rows.length > 0) {
        const record = result.rows[0];
        console.log(chalk.blue(`[AUTH] Stored code: ${record.code}, is_customer: ${record.is_customer}, expires_at: ${record.expires_at}`));
      }

      if (result.rows.length === 0) {
        console.log(chalk.red(`[AUTH] 2FA failed - No code found for: ${body.email}`));
        return { success: false, message: 'Verification code not found or expired' };
      }

      const record = result.rows[0];
      const now = new Date();
      const expiresAt = new Date(record.expires_at);

      // Check if code has expired
      if (now > expiresAt) {
        console.log(chalk.red(`[AUTH] 2FA failed - Code expired for: ${body.email}`));
        await client.query('DELETE FROM verification_codes WHERE email = $1', [body.email]);
        return { success: false, message: 'Verification code has expired. Please try logging in again.' };
      }

      // Verify the code
      if (record.code !== body.code) {
        console.log(chalk.red(`[AUTH] 2FA failed - Invalid code for: ${body.email}`));
        return { success: false, message: 'Invalid verification code' };
      }

      // Code is valid, fetch admin user data
      const adminResult = await client.query(
        'SELECT * FROM user_admins WHERE email = $1',
        [body.email],
      );

      if (adminResult.rows.length === 0) {
        return { success: false, message: 'Admin user not found' };
      }

      const admin = adminResult.rows[0];

      // Delete the used verification code
      await client.query('DELETE FROM verification_codes WHERE email = $1', [body.email]);

      console.log(chalk.green(`[AUTH] 2FA verification successful for admin: ${admin.email}`));

      // Log the 2FA verification
      await this.auditLogger.log({
        userId: admin.admin_id,
        userType: 'admin',
        userEmail: admin.email,
        userName: `${admin.firstname} ${admin.lastname}`,
        action: 'VERIFY_2FA',
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      });

      return {
        success: true,
        role: 'admin',
        user: {
          id: admin.admin_id,
          email: admin.email,
          firstname: admin.firstname,
          lastname: admin.lastname,
        },
      };
    } catch (err) {
      console.error(chalk.red('[ERROR] 2FA verification error:'), err);
      return { success: false, message: 'Verification error. Please try again.' };
    }
  }
}
