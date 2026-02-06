import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseService } from './service/database/database.service';
import { SupabaseService } from './service/supabase/supabase.service';
import { EmailService } from './service/email/email.service';
import { SignUpController } from './controllers/signup.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
  ],
  controllers: [AppController, SignUpController],
  providers: [AppService, DatabaseService, SupabaseService, EmailService],
})
export class AppModule {}
