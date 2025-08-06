import { Recalada, CreateRecaladaDto } from '../entities/Recalada';

export interface RecaladaRepository {
  create(recaladaData: CreateRecaladaDto): Promise<Recalada>;
  findById(id: string): Promise<Recalada | null>;
  findActive(fecha?: Date): Promise<Recalada[]>;
  findByBuque(buqueId: string): Promise<Recalada[]>;
  findByDateRange(fechaInicio: Date, fechaFin: Date): Promise<Recalada[]>;
  update(id: string, recaladaData: Partial<Recalada>): Promise<Recalada>;
  findAll(filters?: any): Promise<Recalada[]>;
  delete(id: string): Promise<void>;
}
