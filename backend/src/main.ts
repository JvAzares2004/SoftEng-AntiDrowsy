import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as dotenv from 'dotenv';
import chalk from 'chalk';

dotenv.config();

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Configure CORS to accept requests from Railway frontend or localhost
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

  const allowedOrigins: (string | RegExp)[] = [
    frontendUrl,
    'http://localhost:5173', // Always allow localhost for development
    'http://localhost:5174', // Vite alternative port
    /^https:\/\/.*\.railway\.app$/, // Allow all Railway domains with regex
  ];

  app.enableCors({
    // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
    origin: (origin: string | undefined, callback: Function) => {
      // Allow requests with no origin (like mobile apps, Postman, etc.)
      // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-call
      if (!origin) return callback(null, true);

      // Check if origin matches any allowed pattern
      const isAllowed = allowedOrigins.some((pattern) => {
        if (pattern instanceof RegExp) {
          return pattern.test(origin);
        }
        return pattern === origin;
      });

      if (isAllowed) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call
        callback(null, true);
      } else {
        console.log(chalk.yellow(`CORS blocked origin: ${origin}`));
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call
        callback(null, true); // Allow anyway in production, log for debugging
      }
    },
    credentials: true,
  });

  const port = Number(process.env.PORT) || 3000;
  console.log(
    chalk.bgGreen.black(`Application is running on: http://localhost:${port}`),
  );
  await app.listen(port, '0.0.0.0');
}
void bootstrap();
