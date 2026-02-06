import { Client } from 'pg';
import chalk from 'chalk';

export async function createAdminTable(client: Client) {
  console.log(chalk.cyan('[DATABASE] Creating user_admins table...'));
  await client.query(`
    CREATE TABLE IF NOT EXISTS user_admins (
      admin_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      firstname text NOT NULL,
      lastname text NOT NULL,
      email text UNIQUE NOT NULL,
      contact_number text,
      password text NOT NULL,
      date_created timestamptz DEFAULT now(),
      status text CHECK (status IN ('active','inactive','banned')) DEFAULT 'active'
    );
  `);
  console.log(chalk.green('[DATABASE] user_admins table created successfully!'));
}
