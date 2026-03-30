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

interface AdminUser {
  admin_id: string;
  email: string;
  firstname: string;
  lastname: string;
  [key: string]: unknown;
}

interface CustomerUser {
  customer_id: string;
  email: string;
  firstname: string;
  lastname: string;
  [key: string]: unknown;
}

type User = AdminUser | CustomerUser;

@Controller('auth')
export class LoginController {
  constructor(
    private readonly dbService: DatabaseService,
    private readonly emailService: EmailService,
    private readonly auditLogger: AuditLoggerService,
  ) {}

  @Post('login')
  async login(@Body() body: LoginDto, @Req() req: Request) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const client = this.dbService.getClient();

    try {
      let role: 'admin' | 'user' | null = null;
      let user: User | null = null;
      let userId = '';

      // 1. Try admin first
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      const result = await client.query(
        'SELECT * FROM admin WHERE email = $1',
        [body.email],
      );

      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      if (result.rows.length > 0) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        user = result.rows[0] as AdminUser;
        role = 'admin';
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        userId = String(result.rows[0].admin_id);

        // Check if admin account is active
        const adminUser = user;
        const statusValue = adminUser?.status as string;
        const status = statusValue ? statusValue.toLowerCase() : '';
        if (status && status !== 'active') {
          return {
            success: false,
            message: 'Admin account is inactive. Please contact support.',
          };
        }

        // For admins, verify password first then send 2FA code
        const password = String(adminUser.password);
        const passwordMatches = await bcrypt.compare(body.password, password);

        if (!passwordMatches) {
          console.log(
            chalk.red(
              `[AUTH] Login failed - Incorrect password for admin: ${body.email}`,
            ),
          );
          return { success: false, message: 'Invalid email or password' };
        }

        // Generate and send 2FA code
        const userEmail = String(adminUser.email);
        const code = await this.emailService.sendVerification(userEmail);
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

        console.log(
          chalk.blue(`[AUTH] Generated code: ${code} for ${userEmail}`),
        );
        console.log(
          chalk.blue(`[AUTH] Code expires at: ${expiresAt.toISOString()}`),
        );

        // Store 2FA code in database
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
        await client.query(
          `INSERT INTO verification_codes (email, code, is_customer, expires_at)
           VALUES ($1, $2, $3, $4)
           ON CONFLICT (email) 
           DO UPDATE SET code = $2, is_customer = $3, expires_at = $4, created_at = CURRENT_TIMESTAMP`,
          [userEmail, code, false, expiresAt],
        );

        console.log(
          chalk.yellow(`[AUTH] 2FA code sent to admin: ${userEmail}`),
        );

        return {
          success: false,
          require2FA: true,
          message: 'Please check your email for the verification code',
        };
      }

      // 2. If not admin, try user (customer)
      if (!user) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
        const customerResult = await client.query(
          'SELECT * FROM user_customers WHERE email = $1',
          [body.email],
        );

        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        if (customerResult.rows.length > 0) {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
          user = customerResult.rows[0] as CustomerUser;
          role = 'user';
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
          userId = String(customerResult.rows[0].customer_id);
        }
      }

      // Check if user exists
      if (!user) {
        console.log(
          chalk.red(`[AUTH] Login failed - User not found: ${body.email}`),
        );
        return { success: false, message: 'Invalid email or password' };
      }

      // Verify password
      const userRecord = user as unknown as Record<string, unknown>;
      const password = String(userRecord.password);
      const passwordMatches = await bcrypt.compare(body.password, password);

      if (!passwordMatches) {
        console.log(
          chalk.red(
            `[AUTH] Login failed - Incorrect password for: ${body.email}`,
          ),
        );
        return { success: false, message: 'Invalid email or password' };
      }

      const userEmail = String(userRecord.email);
      console.log(chalk.green(`[AUTH] ${role} login successful: ${userEmail}`));

      await this.auditLogger.log({
        userId,
        userType: role as 'admin' | 'user',
        userEmail: String(userRecord.email),
        userName: `${String(userRecord.firstname)} ${String(userRecord.lastname)}`,
        action: 'LOGIN',
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      });

      return {
        success: true,
        role,
        user: {
          id: userId,
          email: userRecord.email,
          firstname: userRecord.firstname,
          lastname: userRecord.lastname,
        },
      };
    } catch (err) {
      console.error(chalk.red('[ERROR] Login error:'), err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      return {
        success: false,
        message: 'Login error. Please try again.',
        error: errorMessage,
      };
    }
  }

  @Post('verify-2fa')
  async verify2FA(@Body() body: Verify2FADto, @Req() req: Request) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const client = this.dbService.getClient();

    try {
      console.log(
        chalk.blue(
          `[AUTH] Verifying 2FA for: ${body.email}, code: ${body.code}`,
        ),
      );

      // Debug: Check all records for this email
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      const debugResult = await client.query(
        'SELECT * FROM verification_codes WHERE email = $1',
        [body.email],
      );

      console.log(
        chalk.blue(`[AUTH] All records for ${body.email}:`),
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        debugResult.rows,
      );

      // Retrieve the verification code from database
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      const result = await client.query(
        'SELECT * FROM verification_codes WHERE email = $1 AND is_customer = false',
        [body.email],
      );

      console.log(
        chalk.blue(
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
          `[AUTH] Found ${result.rows.length} records for ${body.email}`,
        ),
      );

      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      if (result.rows.length > 0) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        const record = result.rows[0] as Record<string, unknown>;
        console.log(
          chalk.blue(
            `[AUTH] Stored code: ${String(record.code)}, is_customer: ${String(record.is_customer)}, expires_at: ${String(record.expires_at)}`,
          ),
        );
      }

      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      if (result.rows.length === 0) {
        console.log(
          chalk.red(`[AUTH] 2FA failed - No code found for: ${body.email}`),
        );
        return {
          success: false,
          message: 'Verification code not found or expired',
        };
      }

      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      const record = result.rows[0] as Record<string, unknown>;
      const now = new Date();
      const expiresAt = new Date(record.expires_at as string);

      // Check if code has expired
      if (now > expiresAt) {
        console.log(
          chalk.red(`[AUTH] 2FA failed - Code expired for: ${body.email}`),
        );
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
        await client.query('DELETE FROM verification_codes WHERE email = $1', [
          body.email,
        ]);
        return {
          success: false,
          message:
            'Verification code has expired. Please try logging in again.',
        };
      }

      // Verify the code
      if (record.code !== body.code) {
        console.log(
          chalk.red(`[AUTH] 2FA failed - Invalid code for: ${body.email}`),
        );
        return { success: false, message: 'Invalid verification code' };
      }

      // Code is valid, fetch admin user data
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      const adminResult = await client.query(
        'SELECT * FROM user_admins WHERE email = $1',
        [body.email],
      );

      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      if (adminResult.rows.length === 0) {
        return { success: false, message: 'Admin user not found' };
      }

      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      const admin = adminResult.rows[0] as AdminUser;

      // Delete the used verification code
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      await client.query('DELETE FROM verification_codes WHERE email = $1', [
        body.email,
      ]);

      console.log(
        chalk.green(
          `[AUTH] 2FA verification successful for admin: ${admin.email}`,
        ),
      );

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
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      return {
        success: false,
        message: 'Verification error. Please try again.',
        error: errorMessage,
      };
    }
  }
}
