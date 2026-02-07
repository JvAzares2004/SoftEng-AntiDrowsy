import { Client } from 'pg';
import chalk from 'chalk';

export interface Feedback {
  feedback_id?: number;
  customer_id: string; // UUID
  feedback_message: string;
  timestamp?: Date;
}

export async function createFeedbacksTable(client: Client) {
  console.log(chalk.cyan('[DATABASE] Creating feedbacks table...'));
  await client.query(`
    CREATE TABLE IF NOT EXISTS feedbacks (
      feedback_id SERIAL PRIMARY KEY,
      customer_id uuid NOT NULL,
      feedback_message TEXT NOT NULL,
      timestamp TIMESTAMPTZ DEFAULT NOW(),
      CONSTRAINT feedback_not_empty CHECK (LENGTH(TRIM(feedback_message)) > 0),
      CONSTRAINT fk_customer FOREIGN KEY (customer_id) REFERENCES user_customers(customer_id) ON DELETE CASCADE
    );
  `);
  
  // Create indexes if they don't exist
  await client.query(`
    CREATE INDEX IF NOT EXISTS idx_feedbacks_customer_id ON feedbacks(customer_id);
  `);
  await client.query(`
    CREATE INDEX IF NOT EXISTS idx_feedbacks_timestamp ON feedbacks(timestamp DESC);
  `);
  
  console.log(chalk.green('[DATABASE] feedbacks table created successfully!'));
}
