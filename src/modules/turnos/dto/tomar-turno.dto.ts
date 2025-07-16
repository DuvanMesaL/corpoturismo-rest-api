import { IsOptional, IsString } from 'class-validator';

export class TomarTurnoDto {
  @IsOptional()
  @IsString()
  observaciones?: string;
}
