import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as dotenv from 'dotenv';
import chalk from 'chalk';

dotenv.config();

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({ origin: 'http://localhost:5173', credentials: true });
  const port = Number(process.env.PORT) || 3000;
  console.log(
    chalk.bgGreen.black(`Application is running on: http://localhost:${port}`),
  );
  await app.listen(port);
}
bootstrap();
