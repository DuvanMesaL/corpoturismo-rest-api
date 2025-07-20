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
  // eslint-disable-next-line @typescript-eslint/no-unsafe-call
  @Transform(({ value }) => Number.parseInt(value, 10))
  PORT = 3001;

  @IsString()
  DB_HOST = 'localhost';

  @IsNumber()
  // eslint-disable-next-line @typescript-eslint/no-unsafe-call
  @Transform(({ value }) => Number.parseInt(value, 10))
  DB_PORT = 5432;

  @IsString()
  DB_USERNAME: string;

  @IsString()
  DB_PASSWORD: string;

  @IsString()
  DB_NAME: string;

  @IsString()
  MONGODB_URI = 'mongodb://localhost:27017/turnos_logs';

  @IsString()
  JWT_SECRET: string;

  @IsString()
  @IsOptional()
  JWT_EXPIRES_IN = '24h';

  @IsString()
  BREVO_API_KEY: string;

  @IsEmail()
  BREVO_SENDER_EMAIL: string;

  @IsString()
  BREVO_SENDER_NAME: string;

  @IsUrl()
  @IsOptional()
  FRONTEND_URL = 'http://localhost:3000';
}

export function validateEnvironment(config: Record<string, unknown>) {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call
  const validatedConfig = plainToClass(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });

  // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
  const errors = validateSync(validatedConfig, {
    skipMissingProperties: false,
  });

  if (errors.length > 0) {
    throw new Error(`Environment validation failed: ${errors.toString()}`);
  }

  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  return validatedConfig;
}
