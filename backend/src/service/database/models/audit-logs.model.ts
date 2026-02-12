import { Client } from 'pg';
import chalk from 'chalk';

export async function createAuditLogsTable(client: Client) {
  console.log(chalk.cyan('[DATABASE] Creating audit_logs table...'));
  await client.query(`
    CREATE TABLE IF NOT EXISTS audit_logs (
      log_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id uuid NOT NULL,
      user_type text NOT NULL CHECK (user_type IN ('admin', 'user')),
      user_email text NOT NULL,
      user_name text NOT NULL,
      action text NOT NULL,
      details text,
      ip_address text,
      user_agent text,
      created_at timestamptz DEFAULT now()
    );

    CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
    CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
  `);
  console.log(chalk.green('[DATABASE] audit_logs table created successfully!'));
}
