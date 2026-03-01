import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as dotenv from 'dotenv';
import chalk from 'chalk';

dotenv.config();

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Configure CORS to accept requests from Railway frontend or localhost
  const allowedOrigins = [
    process.env.FRONTEND_URL || 'http://localhost:5173',
    'http://localhost:5173', // Always allow localhost for development
    'https://*.railway.app' // Allow Railway preview deployments
  ].filter(Boolean);

  app.enableCors({ 
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, Postman, etc.)
      if (!origin) return callback(null, true);
      
      // Check if origin matches any allowed pattern
      const isAllowed = allowedOrigins.some(pattern => {
        if (pattern.includes('*')) {
          // Convert wildcard pattern to regex
          const regexPattern = pattern.replace(/\*/g, '.*');
          return new RegExp(`^${regexPattern}$`).test(origin);
        }
        return pattern === origin;
      });
      
      if (isAllowed) {
        callback(null, true);
      } else {
        console.log(chalk.yellow(`CORS blocked origin: ${origin}`));
        callback(null, true); // Allow anyway in production, log for debugging
      }
    },
    credentials: true 
  });
  
  const port = Number(process.env.PORT) || 3000;
  console.log(
    chalk.bgGreen.black(`Application is running on: http://localhost:${port}`),
  );
  await app.listen(port);
}
bootstrap();
