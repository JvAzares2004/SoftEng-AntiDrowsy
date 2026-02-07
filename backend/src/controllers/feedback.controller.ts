import { Body, Controller, Post } from '@nestjs/common';
import { DatabaseService } from '../service/database/database.service';
import chalk from 'chalk';

console.log(chalk.bgGreen.black('[CONTROLLER] Feedback controller loaded'));

interface FeedbackDto {
  email: string;
  feedback_message: string;
}

@Controller('feedback')
export class FeedbackController {
  constructor(private readonly dbService: DatabaseService) {}

  @Post('submit')
  async submitFeedback(@Body() body: FeedbackDto) {
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
}
