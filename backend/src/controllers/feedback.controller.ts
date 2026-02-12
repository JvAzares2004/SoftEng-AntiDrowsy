import { Body, Controller, Post, Get, Req } from '@nestjs/common';
import { DatabaseService } from '../service/database/database.service';
import { AuditLoggerService } from '../service/audit-logger/audit-logger.service';
import chalk from 'chalk';
import type { Request } from 'express';

console.log(chalk.bgGreen.black('[CONTROLLER] Feedback controller loaded'));

interface FeedbackDto {
  email: string;
  feedback_message: string;
}

@Controller('feedback')
export class FeedbackController {
  constructor(
    private readonly dbService: DatabaseService,
    private readonly auditLogger: AuditLoggerService,
  ) {}

  @Post('submit')
  async submitFeedback(@Body() body: FeedbackDto, @Req() req: Request) {
    const client = this.dbService.getClient();

    try {
      // Validate input
      if (!body.feedback_message || body.feedback_message.trim().length === 0) {
        return {
          success: false,
          message: 'Feedback cannot be empty',
        };
      }

      // Limit feedback length to prevent abuse
      if (body.feedback_message.length > 5000) {
        return {
          success: false,
          message: 'Feedback is too long. Please limit to 5000 characters.',
        };
      }

      // Get customer_id from email
      const customerResult = await client.query(
        'SELECT customer_id FROM user_customers WHERE email = $1',
        [body.email],
      );

      if (customerResult.rows.length === 0) {
        return {
          success: false,
          message: 'User not found',
        };
      }

      const customerId = customerResult.rows[0].customer_id;
      const customer = customerResult.rows[0];

      // Get full customer details for audit log
      const fullCustomerResult = await client.query(
        'SELECT firstname, lastname FROM user_customers WHERE customer_id = $1',
        [customerId],
      );

      const customerDetails = fullCustomerResult.rows[0];

      // Use parameterized query to prevent SQL injection
      const result = await client.query(
        `INSERT INTO feedbacks (customer_id, feedback_message, timestamp) 
         VALUES ($1, $2, NOW()) 
         RETURNING feedback_id`,
        [customerId, body.feedback_message.trim()],
      );

      console.log(
        chalk.green(
          `[FEEDBACK] New feedback submitted from customer_id: ${customerId}`,
        ),
      );

      // Log the feedback submission action
      await this.auditLogger.log({
        userId: customerId,
        userType: 'user',
        userEmail: body.email,
        userName: `${customerDetails.firstname} ${customerDetails.lastname}`,
        action: 'SUBMIT_FEEDBACK',
        details: `Feedback length: ${body.feedback_message.trim().length} characters`,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      });

      return {
        success: true,
        message: 'Feedback submitted successfully',
        feedbackId: result.rows[0].feedback_id,
      };
    } catch (err) {
      console.error(chalk.red('[ERROR] Feedback submission error:'), err);
      return {
        success: false,
        message: 'Failed to submit feedback. Please try again.',
      };
    }
  }

  @Get('all')
  async getAllFeedbacks() {
    const client = this.dbService.getClient();

    try {
      const result = await client.query(
        `SELECT 
          f.feedback_id,
          f.feedback_message,
          f.timestamp,
          c.customer_id,
          c.firstname,
          c.lastname,
          c.email
         FROM feedbacks f
         INNER JOIN user_customers c ON f.customer_id = c.customer_id
         ORDER BY f.timestamp DESC`,
      );

      console.log(
        chalk.green(`[FEEDBACK] Retrieved ${result.rows.length} feedbacks`),
      );

      return {
        success: true,
        feedbacks: result.rows,
      };
    } catch (err) {
      console.error(chalk.red('[ERROR] Get all feedbacks error:'), err);
      return {
        success: false,
        message: 'Failed to retrieve feedbacks',
        feedbacks: [],
      };
    }
  }
}
