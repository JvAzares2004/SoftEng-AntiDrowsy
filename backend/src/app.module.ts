import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseService } from './service/database/database.service';
import { SupabaseService } from './service/supabase/supabase.service';
import { EmailService } from './service/email/email.service';
import { AuditLoggerService } from './service/audit-logger/audit-logger.service';
import { SignUpController } from './controllers/signup.controller';
import { AdminSignUpController } from './controllers/admin-signup.controller';
import { LoginController } from './controllers/login.controller';
import { ProfileController } from './controllers/profile.controller';
import { FeedbackController } from './controllers/feedback.controller';
import { DeviceController } from './controllers/device.controller';
import { LogsController } from './controllers/logs.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
  ],
  controllers: [
    AppController,
    SignUpController,
    AdminSignUpController,
    LoginController,
    ProfileController,
    FeedbackController,
    DeviceController,
    LogsController,
  ],
  providers: [
    AppService,
    DatabaseService,
    SupabaseService,
    EmailService,
    AuditLoggerService,
  ],
})
export class AppModule {}
