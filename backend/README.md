# Backend - Drowsiness Detection System

## Overview
NestJS backend server with Supabase integration for the Drowsiness Detection application.

## Prerequisites
- Node.js (v18 or higher)
- PostgreSQL (via Supabase)
- npm or yarn

## Setup Instructions

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables
A `.env` file has been created in the backend root directory. Update it with your actual credentials:

```env
DATABASE_URL='postgresql://postgres:[YOUR-PASSWORD]@db.qfawrlrpyytiycbmdmbw.supabase.co:5432/postgres'
PORT='3000'
SUPABASE_SERVICE_ROLE_KEY='your-service-role-key-here'
SUPABASE_URL='https://qfawrlrpyytiycbmdmbw.supabase.co'
```

**Important:** Replace `[YOUR-PASSWORD]` with your actual Supabase database password and update the service role key from your Supabase dashboard.

### 3. Supabase Connection Details
The connection string format for direct psql access:
```bash
psql -h db.qfawrlrpyytiycbmdmbw.supabase.co -p 5432 -d postgres -U postgres
```

## Running the Application

### Development Mode (with hot reload)
```bash
npm run start:dev
```

### Production Mode
```bash
npm run build
npm run start:prod
```

## Project Structure
```
backend/
├── src/
│   ├── service/
│   │   ├── database/
│   │   │   └── database.service.ts    # PostgreSQL database service
│   │   └── supabase/
│   │       └── supabase.service.ts    # Supabase client service
│   ├── app.module.ts                  # Main application module
│   ├── app.controller.ts
│   ├── app.service.ts
│   └── main.ts                        # Application entry point
├── .env                               # Environment variables (not in git)
└── package.json
```

## Available Services

### DatabaseService
- PostgreSQL client connection using the `pg` library
- Direct database queries via `query()` method
- Automatic connection on module initialization
- Graceful connection cleanup on module destroy

### SupabaseService
- Supabase client instance
- File storage operations:
  - `uploadFile()` - Upload files to Supabase Storage
  - `deleteFile()` - Delete files from storage
  - `listFiles()` - List files in a bucket

## API Endpoints
The server runs on `http://localhost:3000` by default.

Default endpoint:
- GET `/` - Returns "Hello World!"

## CORS Configuration
CORS is enabled for the frontend running on `http://localhost:5173`.

## Testing
```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Test coverage
npm run test:cov
```

## Additional Notes
- All environment variables are loaded globally via ConfigModule
- The database service automatically connects on module initialization
- Database connection uses SSL with `rejectUnauthorized: false` for Supabase
- Console logs use chalk for colored output

---

Built with [NestJS](https://nestjs.com/) - A progressive Node.js framework
