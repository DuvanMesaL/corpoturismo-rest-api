import { Buque, CreateBuqueDto } from '../entities/Buque';

export interface BuqueRepository {
  create(buqueData: CreateBuqueDto): Promise<Buque>;
  findById(id: string): Promise<Buque | null>;
  findByNombre(nombre: string): Promise<Buque | null>;
  update(id: string, buqueData: Partial<Buque>): Promise<Buque>;
  findAll(filters?: any): Promise<Buque[]>;
  delete(id: string): Promise<void>;
}
