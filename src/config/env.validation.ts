import { plainToClass, Transform } from 'class-transformer';
import {
  IsString,
  IsNumber,
  IsOptional,
  validateSync,
  IsEmail,
  IsUrl,
} from 'class-validator';

class EnvironmentVariables {
  @IsString()
  NODE_ENV = 'development';

  @IsNumber()
  @Transform(({ value }) => Number.parseInt(value, 10))
  PORT = 3001;

  // Database
  @IsString()
  DB_HOST = 'localhost';

  @IsNumber()
  @Transform(({ value }) => Number.parseInt(value, 10))
  DB_PORT = 5432;

  @IsString()
  DB_USERNAME: string;

  @IsString()
  DB_PASSWORD: string;

  @IsString()
  DB_NAME: string;

  // MongoDB
  @IsString()
  MONGODB_URI = 'mongodb://localhost:27017/turnos_logs';

  // JWT
  @IsString()
  JWT_SECRET: string;

  @IsString()
  @IsOptional()
  JWT_EXPIRES_IN = '24h';

  // Email
  @IsString()
  BREVO_API_KEY: string;

  @IsEmail()
  BREVO_SENDER_EMAIL: string;

  @IsString()
  BREVO_SENDER_NAME: string;

  // Frontend
  @IsUrl()
  @IsOptional()
  FRONTEND_URL = 'http://localhost:3000';
}

export function validateEnvironment(config: Record<string, unknown>) {
  const validatedConfig = plainToClass(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });

  const errors = validateSync(validatedConfig, {
    skipMissingProperties: false,
  });

  if (errors.length > 0) {
    throw new Error(`Environment validation failed: ${errors.toString()}`);
  }

  return validatedConfig;
}
