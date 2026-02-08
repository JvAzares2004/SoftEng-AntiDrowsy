import { Body, Controller, Post, Req } from '@nestjs/common';
import { DatabaseService } from '../service/database/database.service';
import { AuditLoggerService } from '../service/audit-logger/audit-logger.service';
import * as bcrypt from 'bcrypt';
import chalk from 'chalk';
import type { Request } from 'express';

console.log(chalk.bgGreen.black('[CONTROLLER] Admin SignUp controller loaded'));

interface AdminSignUpDto {
  firstname: string;
  lastname: string;
  contact_number: string;
  email: string;
  password: string;
}

@Controller('admin/auth')
export class AdminSignUpController {
  constructor(
    private readonly dbService: DatabaseService,
    private readonly auditLogger: AuditLoggerService,
  ) {}

  @Post('check-email')
  async checkEmail(@Body() body: { email: string }) {
    const client = this.dbService.getClient();

    try {
      const result = await client.query(
        'SELECT email FROM user_admins WHERE email = $1',
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
      console.error(chalk.red('[ERROR] Checking admin email:'), error);
      return { success: false, message: 'Error checking email availability' };
    }
  }

  @Post('check-contact')
  async checkContact(@Body() body: { contact_number: string }) {
    const client = this.dbService.getClient();

    try {
      const result = await client.query(
        'SELECT contact_number FROM user_admins WHERE contact_number = $1',
        [body.contact_number],
      );

      return {
        success: true,
        isAvailable: result.rows.length === 0,
        message:
          result.rows.length > 0
            ? 'Contact number already registered'
            : 'Contact number available',
      };
    } catch (error) {
      console.error(chalk.red('[ERROR] Checking admin contact number:'), error);
      return { success: false, message: 'Error checking contact number availability' };
    }
  }

  @Post('signup')
  async signUp(@Body() signUpDto: AdminSignUpDto, @Req() req: Request) {
    const client = this.dbService.getClient();
    const { firstname, lastname, contact_number, email, password } = signUpDto;

    console.log(chalk.yellow(`[AUTH] Admin signup attempt for ${email}`));

    try {
      // Check if email already exists
      const existingAdmin = await client.query(
        'SELECT admin_id FROM user_admins WHERE email = $1',
        [email],
      );

      if (existingAdmin.rows.length > 0) {
        console.log(chalk.red(`[AUTH] Admin email already exists: ${email}`));
        return {
          success: false,
          message:
            'This email is already registered. Please use a different email or sign in.',
        };
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Insert new admin
      const result = await client.query(
        `INSERT INTO user_admins (firstname, lastname, contact_number, email, password)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING admin_id, firstname, lastname, email`,
        [firstname, lastname, contact_number, email, hashedPassword],
      );

      const newAdmin = result.rows[0];
      console.log(
        chalk.green(
          `[AUTH] Admin account created successfully for ${newAdmin.email}`,
        ),
      );

      // Log the admin signup action
      await this.auditLogger.log({
        userId: newAdmin.admin_id,
        userType: 'admin',
        userEmail: newAdmin.email,
        userName: `${newAdmin.firstname} ${newAdmin.lastname}`,
        action: 'ADMIN_SIGNUP',
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      });

      return {
        success: true,
        message: 'Admin account created successfully',
        admin: {
          admin_id: newAdmin.admin_id,
          firstname: newAdmin.firstname,
          lastname: newAdmin.lastname,
          email: newAdmin.email,
        },
      };
    } catch (error) {
      console.error(chalk.red('[ERROR] Admin signup failed:'), error);
      return {
        success: false,
        message: 'Failed to create admin account. Please try again.',
      };
    }
  }
}
