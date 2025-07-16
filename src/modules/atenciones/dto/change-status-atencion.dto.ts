import { IsEnum, IsOptional, IsString, IsDate } from 'class-validator';
import { Type } from 'class-transformer';
import { EstadoAtencion } from '../entities/atencion.entity';

export class ChangeStatusAtencionDto {
  @IsEnum(EstadoAtencion)
  estado: EstadoAtencion;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  fechaInicio?: Date;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  fechaFin?: Date;

  @IsOptional()
  @IsString()
  observaciones?: string;
}
