import { Body, Controller, Post, Req } from '@nestjs/common';
import { DatabaseService } from '../service/database/database.service';
import { AuditLoggerService } from '../service/audit-logger/audit-logger.service';
import * as bcrypt from 'bcrypt';
import chalk from 'chalk';
import { EmailService } from '../service/email/email.service';
import type { Request } from 'express';

console.log(chalk.bgGreen.black('[CONTROLLER] SignUp user controller loaded'));

interface SignUpDto {
  firstname: string;
  lastname: string;
  contact_number: string;
  email: string;
  password: string;
}

@Controller('auth')
export class SignUpController {
  constructor(
    private readonly dbService: DatabaseService,
    private readonly emailService: EmailService,
    private readonly auditLogger: AuditLoggerService,
  ) {}

  @Post('check-email')
  async checkEmail(@Body() body: { email: string }) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const client = this.dbService.getClient();

    try {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const result = await client.query(
        'SELECT email FROM user_customers WHERE email = $1',
        [body.email],
      );

      return {
        success: true,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        isAvailable: result.rows.length === 0,
        message:
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
          result.rows.length > 0
            ? 'Email already registered'
            : 'Email available',
      };
    } catch (error) {
      console.error(chalk.red('[ERROR] Checking email:'), error);
      return { success: false, message: 'Error checking email availability' };
    }
  }

  @Post('check-contact')
  async checkContact(@Body() body: { contact_number: string }) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const client = this.dbService.getClient();

    try {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const result = await client.query(
        'SELECT contact_number FROM user_customers WHERE contact_number = $1',
        [body.contact_number],
      );

      return {
        success: true,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        isAvailable: result.rows.length === 0,
        message:
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
          result.rows.length > 0
            ? 'Contact number already registered'
            : 'Contact number available',
      };
    } catch (error) {
      console.error(chalk.red('[ERROR] Checking contact number:'), error);
      return {
        success: false,
        message: 'Error checking contact number availability',
      };
    }
  }

  @Post('send-verification')
  async sendVerification(@Body() body: { email: string }) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const client = this.dbService.getClient();

    try {
      // Clean up expired codes
      await client.query(
        'DELETE FROM verification_codes WHERE expires_at < CURRENT_TIMESTAMP',
      );

      // Check if email already exists
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const existingUser = await client.query(
        'SELECT customer_id FROM user_customers WHERE email = $1',
        [body.email],
      );

      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      if (existingUser.rows.length > 0) {
        return {
          success: false,
          message:
            'This email is already registered. Please use a different email or sign in.',
        };
      }

      // Generate and send verification code
      const code = await this.emailService.sendVerification(body.email);

      const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

      // Check if verification code already exists for this email
      const existingCode = await client.query(
        'SELECT id FROM verification_codes WHERE email = $1',
        [body.email],
      );

      if (existingCode.rows.length > 0) {
        // Update existing code
        await client.query(
          `UPDATE verification_codes 
           SET code = $1, expires_at = $2, created_at = CURRENT_TIMESTAMP
           WHERE email = $3`,
          [code, expiresAt, body.email],
        );
      } else {
        // Insert new code
        await client.query(
          `INSERT INTO verification_codes (email, code, is_customer, expires_at)
           VALUES ($1, $2, $3, $4)`,
          [body.email, code, true, expiresAt],
        );
      }

      console.log(
        chalk.green(`[AUTH] Verification code sent to ${body.email}`),
      );
      return { success: true, message: 'Verification code sent to your email' };
    } catch (error) {
      console.error(chalk.red('[ERROR] Sending verification code:'), error);
      return { success: false, message: 'Failed to send verification code' };
    }
  }

  @Post('verify-code')
  async verifyCode(@Body() body: { email: string; code: string }) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const client = this.dbService.getClient();

    try {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const result = await client.query(
        `SELECT * FROM verification_codes 
         WHERE email = $1 AND code = $2 AND expires_at > CURRENT_TIMESTAMP`,
        [body.email, body.code],
      );

      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      if (result.rows.length === 0) {
        return {
          success: false,
          message: 'Invalid or expired verification code',
        };
      }

      console.log(chalk.green(`[AUTH] Code verified for ${body.email}`));
      return { success: true, message: 'Code verified successfully' };
    } catch (error) {
      console.error(chalk.red('[ERROR] Verifying code:'), error);
      return { success: false, message: 'Error verifying code' };
    }
  }

  @Post('signup')
  async signUp(@Body() signUpDto: SignUpDto, @Req() req: Request) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const client = this.dbService.getClient();

    try {
      // Hash password
      const hashedPassword = await bcrypt.hash(signUpDto.password, 10);

      // Insert new user
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const result = await client.query(
        `INSERT INTO user_customers (firstname, lastname, email, contact_number, password)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING customer_id, firstname, lastname, email, contact_number, date_created`,
        [
          signUpDto.firstname,
          signUpDto.lastname,
          signUpDto.email,
          signUpDto.contact_number,
          hashedPassword,
        ],
      );

      // Delete the verification code after successful signup
      await client.query('DELETE FROM verification_codes WHERE email = $1', [
        signUpDto.email,
      ]);

      console.log(
        chalk.green(`[AUTH] New user registered: ${signUpDto.email}`),
      );

      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
      const newUser = result.rows[0];

      // Log the signup action
      await this.auditLogger.log({
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
        userId: newUser.customer_id,
        userType: 'user',
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
        userEmail: newUser.email,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        userName: `${newUser.firstname} ${newUser.lastname}`,
        action: 'SIGNUP',
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      });

      return {
        success: true,
        message: 'Account created successfully',
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        user: newUser,
      };
    } catch (error) {
      console.error(chalk.red('[ERROR] Creating user:'), error);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      if (error.code === '23505') {
        // Unique violation
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
        if (error.constraint?.includes('email')) {
          return { success: false, message: 'Email already exists' };
        }
      }

      return { success: false, message: 'Error creating account' };
    }
  }

  @Post('forgot-password')
  async forgotPassword(@Body() body: { email: string }) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const client = this.dbService.getClient();

    try {
      // Clean up expired codes
      await client.query(
        'DELETE FROM verification_codes WHERE expires_at < CURRENT_TIMESTAMP',
      );

      // Check if email exists in the database
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const existingUser = await client.query(
        'SELECT customer_id FROM user_customers WHERE email = $1',
        [body.email],
      );

      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      if (existingUser.rows.length === 0) {
        return {
          success: false,
          message: 'Account does not exist',
        };
      }

      // Generate and send verification code
      const code = await this.emailService.sendVerification(body.email);

      const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

      // Check if verification code already exists for this email
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const existingCode = await client.query(
        'SELECT id FROM verification_codes WHERE email = $1',
        [body.email],
      );

      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      if (existingCode.rows.length > 0) {
        // Update existing code
        await client.query(
          `UPDATE verification_codes 
           SET code = $1, expires_at = $2, created_at = CURRENT_TIMESTAMP, is_customer = $3
           WHERE email = $4`,
          [code, expiresAt, true, body.email],
        );
      } else {
        // Insert new code
        await client.query(
          `INSERT INTO verification_codes (email, code, is_customer, expires_at)
           VALUES ($1, $2, $3, $4)`,
          [body.email, code, true, expiresAt],
        );
      }

      console.log(
        chalk.green(`[AUTH] Password reset code sent to ${body.email}`),
      );
      return { success: true, message: 'Verification code sent to your email' };
    } catch (error) {
      console.error(chalk.red('[ERROR] Sending password reset code:'), error);
      return { success: false, message: 'Failed to send verification code' };
    }
  }

  @Post('reset-password')
  async resetPassword(
    @Body() body: { email: string; code: string; newPassword: string },
  ) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const client = this.dbService.getClient();

    try {
      // Verify the code
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const verificationResult = await client.query(
        `SELECT * FROM verification_codes 
         WHERE email = $1 AND code = $2 AND expires_at > CURRENT_TIMESTAMP`,
        [body.email, body.code],
      );

      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      if (verificationResult.rows.length === 0) {
        return {
          success: false,
          message: 'Invalid or expired verification code',
        };
      }

      // Check if user exists
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const userResult = await client.query(
        'SELECT customer_id FROM user_customers WHERE email = $1',
        [body.email],
      );

      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      if (userResult.rows.length === 0) {
        return {
          success: false,
          message: 'User not found',
        };
      }

      // Hash the new password
      const hashedPassword = await bcrypt.hash(body.newPassword, 10);

      // Update the password
      await client.query(
        'UPDATE user_customers SET password = $1 WHERE email = $2',
        [hashedPassword, body.email],
      );

      // Delete the used verification code
      await client.query('DELETE FROM verification_codes WHERE email = $1', [
        body.email,
      ]);

      console.log(chalk.green(`[AUTH] Password reset successful for ${body.email}`));

      return {
        success: true,
        message: 'Password reset successfully',
      };
    } catch (error) {
      console.error(chalk.red('[ERROR] Resetting password:'), error);
      return { success: false, message: 'Failed to reset password' };
    }
  }
}
