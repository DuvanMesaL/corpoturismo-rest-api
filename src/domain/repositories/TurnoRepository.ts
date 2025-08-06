import { Turno, CreateTurnoDto } from '../entities/Turno';

export interface TurnoRepository {
  create(turnoData: CreateTurnoDto & { creadorId: string }): Promise<Turno>;
  findById(id: string): Promise<Turno | null>;
  findByRecalada(recaladaId: string): Promise<Turno[]>;
  findAvailable(filters?: any): Promise<Turno[]>;
  findByGuia(guiaId: string, filters?: any): Promise<Turno[]>;
  update(id: string, turnoData: Partial<Turno>): Promise<Turno>;
  tomarTurno(turnoId: string, guiaId: string): Promise<Turno>;
  liberarTurno(turnoId: string): Promise<Turno>;
  usarTurno(turnoId: string, observaciones?: string): Promise<Turno>;
  terminarTurno(turnoId: string, horasTrabajadas?: number): Promise<Turno>;
  cancelarTurno(turnoId: string, motivo?: string): Promise<Turno>;
  findAll(filters?: any): Promise<Turno[]>;
  delete(id: string): Promise<void>;
}
