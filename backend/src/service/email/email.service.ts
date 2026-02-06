import { Injectable } from '@nestjs/common';
import {
  generateVerificationCode,
  sendVerificationEmail,
} from './email.utils';
import chalk from 'chalk';

console.log(chalk.bgBlue.black('[SERVICE] Email service loaded'));

@Injectable()
export class EmailService {
  async sendVerification(to: string): Promise<string> {
    const code = generateVerificationCode();
    await sendVerificationEmail(to, code);
    return code;
  }
}
