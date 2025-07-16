import {
  IsString,
  IsNumber,
  IsEnum,
  IsOptional,
  IsDate,
  Length,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import {
  TipoAtencion,
  EstadoAtencion,
  PrioridadAtencion,
} from '../entities/atencion.entity';

export class CreateAtencionDto {
  @IsString()
  @Length(1, 20)
  codigo: string;

  @IsNumber()
  recaladaId: number;

  @IsEnum(TipoAtencion)
  tipo: TipoAtencion;

  @IsString()
  @Length(1, 200)
  descripcion: string;

  @IsEnum(EstadoAtencion)
  estado: EstadoAtencion;

  @IsEnum(PrioridadAtencion)
  prioridad: PrioridadAtencion;

  @IsDate()
  @Type(() => Date)
  fechaProgramada: Date;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  fechaInicio?: Date;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  fechaFin?: Date;

  @IsOptional()
  @IsNumber()
  @Min(1)
  duracionEstimada?: number;

  @IsOptional()
  @IsNumber()
  responsableId?: number;

  @IsOptional()
  @IsString()
  observaciones?: string;

  @IsOptional()
  @IsString()
  requisitos?: string;
}
