import {
  IsString,
  IsOptional,
  IsEnum,
  IsNumber,
  Length,
  Min,
} from 'class-validator';
import { TipoBuque, EstadoBuque } from '../entities/buque.entity';

export class CreateBuqueDto {
  @IsString()
  @Length(1, 20)
  codigo: string;

  @IsString()
  @Length(1, 100)
  nombre: string;

  @IsOptional()
  @IsString()
  @Length(1, 50)
  bandera?: string;

  @IsOptional()
  @IsString()
  @Length(1, 20)
  imo?: string;

  @IsOptional()
  @IsString()
  @Length(1, 20)
  mmsi?: string;

  @IsEnum(TipoBuque)
  tipo: TipoBuque;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  eslora?: number;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  manga?: number;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  calado?: number;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  tonelaje?: number;

  @IsOptional()
  @IsString()
  @Length(1, 100)
  armador?: string;

  @IsOptional()
  @IsString()
  @Length(1, 100)
  agente?: string;

  @IsOptional()
  @IsEnum(EstadoBuque)
  estado?: EstadoBuque;

  @IsOptional()
  @IsString()
  observaciones?: string;
}
