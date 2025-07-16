import { IsEnum, IsOptional, IsString } from 'class-validator';
import { EstadoRecalada } from '../entities/recalada.entity';

export class ChangeStatusRecaladaDto {
  @IsEnum(EstadoRecalada)
  estado: EstadoRecalada;

  @IsOptional()
  @IsString()
  observaciones?: string;
}
