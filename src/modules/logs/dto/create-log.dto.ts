import { IsString, IsNumber, IsOptional, IsObject } from 'class-validator';

export class CreateLogDto {
  @IsString()
  action: string;

  @IsNumber()
  userId: number;

  @IsOptional()
  @IsString()
  userEmail?: string;

  @IsOptional()
  @IsString()
  entityType?: string;

  @IsOptional()
  @IsString()
  entityId?: string;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;

  @IsOptional()
  @IsString()
  ipAddress?: string;

  @IsOptional()
  @IsString()
  userAgent?: string;

  @IsOptional()
  @IsString()
  level?: string = 'info';

  @IsOptional()
  @IsString()
  message?: string;
}
