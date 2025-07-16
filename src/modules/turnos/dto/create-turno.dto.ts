import {
  IsNumber,
  IsEnum,
  IsOptional,
  IsString,
  IsDate,
  IsBoolean,
} from 'class-validator';
import { Type } from 'class-transformer';
import { TipoTurno } from '../entities/turno.entity';

export class CreateTurnoDto {
  @IsNumber()
  atencionId: number;

  @IsEnum(TipoTurno)
  tipo: TipoTurno;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  fechaProgramada?: Date;

  @IsOptional()
  @IsNumber()
  tiempoEstimado?: number;

  @IsOptional()
  @IsString()
  observaciones?: string;

  @IsOptional()
  @IsBoolean()
  requiereConfirmacion?: boolean;

  @IsOptional()
  @IsBoolean()
  esReprogramable?: boolean;
}
