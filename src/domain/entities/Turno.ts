export interface Turno {
  id: string;
  recaladaId: string;
  guiaId?: string;
  creadorId: string;
  fechaInicio: Date;
  fechaFin: Date;
  estado: EstadoTurno;
  observaciones?: string;
  horasTrabajadas?: number;
  createdAt: Date;
  updatedAt: Date;

  // Relations
  recalada?: any;
  guia?: any;
  creador?: any;
  atenciones?: any[];
}

export enum EstadoTurno {
  DISPONIBLE = "DISPONIBLE",
  TOMADO = "TOMADO",
  EN_USO = "EN_USO",
  FINALIZADO = "FINALIZADO",
  CANCELADO = "CANCELADO",
}

export interface CreateTurnoDto {
  recaladaId: string;
  fechaInicio: Date;
  fechaFin: Date;
  observaciones?: string;
}

export interface TomarTurnoDto {
  turnoId: string;
  guiaId: string;
}

export interface UsarTurnoDto {
  observaciones?: string;
}
