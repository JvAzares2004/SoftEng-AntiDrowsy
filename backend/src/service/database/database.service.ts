import { Injectable, OnModuleInit } from '@nestjs/common';
import { Client } from 'pg';
import * as dotenv from 'dotenv';
import chalk from 'chalk';

dotenv.config();

console.log(chalk.bgBlue.black('[SERVICE] Database service loaded'));

@Injectable()
export class DatabaseService implements OnModuleInit {
  private client: Client;

  constructor() {
    const connectionString = process.env.DATABASE_URL;

    if (!connectionString) {
      console.error(
        chalk.red.bold(
          '[SUPABASE] DATABASE_URL is not defined in environment variables',
        ),
      );
      throw new Error('[SUPABASE] DATABASE_URL is missing');
    }

    this.client = new Client({
      connectionString,
      ssl: { rejectUnauthorized: false },
    });

    console.log(chalk.blueBright('[SUPABASE] Database client initialized.'));
  }

  async onModuleInit() {
    console.log(chalk.yellow('[SUPABASE] Connecting to the database...'));

    await this.client.connect();
    console.log(chalk.green('[SUPABASE] Connected to the database!'));

    console.log(chalk.cyan('[SUPABASE] Setting up tables...'));
    // Add your table creation functions here
    // await createUsersTable(this.client);
    // await createSessionsTable(this.client);
    // etc.

    console.log(chalk.bgGreen.black('[SUPABASE] Database is ready!'));
  }

  getClient(): Client {
    return this.client;
  }

  async query(text: string, params?: any[]): Promise<any> {
    try {
      const result = await this.client.query(text, params);
      return result;
    } catch (error) {
      console.error(chalk.red('[DATABASE ERROR]'), error);
      throw error;
    }
  }

  async onModuleDestroy() {
    console.log(chalk.yellow('[SUPABASE] Disconnecting from database...'));
    await this.client.end();
    console.log(chalk.green('[SUPABASE] Database connection closed.'));
  }
}
