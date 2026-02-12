import { Client } from 'pg';
import chalk from 'chalk';

export async function createVerificationCodesTable(client: Client) {
  console.log(chalk.cyan('[DATABASE] Creating verification_codes table...'));
  await client.query(`
    CREATE TABLE IF NOT EXISTS verification_codes (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) NOT NULL UNIQUE,
        code VARCHAR(10) NOT NULL,
        is_customer BOOLEAN DEFAULT true,
        expires_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_verification_codes_email ON verification_codes(email);
    CREATE INDEX IF NOT EXISTS idx_verification_codes_expires ON verification_codes(expires_at);
  `);
  console.log(chalk.green('[DATABASE] verification_codes table created successfully!'));
}
