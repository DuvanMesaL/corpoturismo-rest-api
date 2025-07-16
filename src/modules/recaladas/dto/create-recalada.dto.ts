import {
  IsString,
  IsNumber,
  IsEnum,
  IsOptional,
  IsDate,
  IsBoolean,
  Length,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { EstadoRecalada, TipoOperacion } from '../entities/recalada.entity';

export class CreateRecaladaDto {
  @IsString()
  @Length(1, 20)
  codigo: string;

  @IsNumber()
  buqueId: number;

  @IsDate()
  @Type(() => Date)
  fechaArriboProgramada: Date;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  fechaArriboReal?: Date;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  fechaZarpeProgramada?: Date;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  fechaZarpeReal?: Date;

  @IsOptional()
  @IsString()
  @Length(1, 20)
  muelle?: string;

  @IsOptional()
  @IsString()
  @Length(1, 10)
  posicion?: string;

  @IsEnum(EstadoRecalada)
  estado: EstadoRecalada;

  @IsEnum(TipoOperacion)
  tipoOperacion: TipoOperacion;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  cargaProgramada?: number;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  cargaReal?: number;

  @IsOptional()
  @IsString()
  @Length(1, 100)
  mercancia?: string;

  @IsOptional()
  @IsString()
  @Length(1, 100)
  consignatario?: string;

  @IsOptional()
  @IsString()
  observaciones?: string;

  @IsOptional()
  @IsBoolean()
  requierePractico?: boolean;

  @IsOptional()
  @IsBoolean()
  requiereRemolcador?: boolean;
}
