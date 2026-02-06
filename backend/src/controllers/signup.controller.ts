import { Body, Controller, Post } from '@nestjs/common';
import { DatabaseService } from '../service/database/database.service';
import * as bcrypt from 'bcrypt';
import chalk from 'chalk';
import { EmailService } from '../service/email/email.service';

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
  ) {}

  @Post('check-email')
  async checkEmail(@Body() body: { email: string }) {
    const client = this.dbService.getClient();

    try {
      const result = await client.query(
        'SELECT email FROM user_customers WHERE email = $1',
        [body.email],
      );

      return {
        success: true,
        isAvailable: result.rows.length === 0,
        message:
          result.rows.length > 0
            ? 'Email already registered'
            : 'Email available',
      };
    } catch (error) {
      console.error(chalk.red('[ERROR] Checking email:'), error);
      return { success: false, message: 'Error checking email availability' };
    }
  }

  @Post('send-verification')
  async sendVerification(@Body() body: { email: string }) {
    const client = this.dbService.getClient();

    try {
      // Clean up expired codes
      await client.query(
        'DELETE FROM verification_codes WHERE expires_at < CURRENT_TIMESTAMP',
      );

      // Check if email already exists
      const existingUser = await client.query(
        'SELECT customer_id FROM user_customers WHERE email = $1',
        [body.email],
      );

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

      console.log(chalk.green(`[AUTH] Verification code sent to ${body.email}`));
      return { success: true, message: 'Verification code sent to your email' };
    } catch (error) {
      console.error(chalk.red('[ERROR] Sending verification code:'), error);
      return { success: false, message: 'Failed to send verification code' };
    }
  }

  @Post('verify-code')
  async verifyCode(@Body() body: { email: string; code: string }) {
    const client = this.dbService.getClient();

    try {
      const result = await client.query(
        `SELECT * FROM verification_codes 
         WHERE email = $1 AND code = $2 AND expires_at > CURRENT_TIMESTAMP`,
        [body.email, body.code],
      );

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
  async signUp(@Body() signUpDto: SignUpDto) {
    const client = this.dbService.getClient();

    try {
      // Hash password
      const hashedPassword = await bcrypt.hash(signUpDto.password, 10);

      // Insert new user
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

      return {
        success: true,
        message: 'Account created successfully',
        user: result.rows[0],
      };
    } catch (error) {
      console.error(chalk.red('[ERROR] Creating user:'), error);

      if (error.code === '23505') {
        // Unique violation
        if (error.constraint?.includes('email')) {
          return { success: false, message: 'Email already exists' };
        }
      }

      return { success: false, message: 'Error creating account' };
    }
  }
}
