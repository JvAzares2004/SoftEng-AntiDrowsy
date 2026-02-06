import { Client } from 'pg';
import chalk from 'chalk';

export async function createTriggersTable(client: Client) {
  console.log(chalk.cyan('[DATABASE] Creating triggers table...'));
  await client.query(`
    CREATE TABLE IF NOT EXISTS triggers (
      trigger_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      customer_id uuid NOT NULL,
      trigger_type text CHECK (trigger_type IN ('successful', 'failed')) NOT NULL,
      trigger_date timestamptz DEFAULT now(),
      FOREIGN KEY (customer_id) REFERENCES user_customers(customer_id) ON DELETE CASCADE
    );
  `);
  console.log(chalk.green('[DATABASE] triggers table created successfully!'));
}
