import { Client } from 'pg';
import chalk from 'chalk';

export async function createUserCustomerTable(client: Client) {
  console.log(chalk.cyan('[DATABASE] Creating user_customers table...'));
  await client.query(`
    CREATE TABLE IF NOT EXISTS user_customers (
      customer_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      firstname text NOT NULL,
      lastname text NOT NULL,
      email text UNIQUE NOT NULL,
      contact_number text,
      password text NOT NULL,
      monthly_triggers integer DEFAULT 0,
      successful_triggers integer DEFAULT 0,
      failed_triggers integer DEFAULT 0,
      date_created timestamptz DEFAULT now()
    );
  `);
  console.log(chalk.green('[DATABASE] user_customers table created successfully!'));
}
