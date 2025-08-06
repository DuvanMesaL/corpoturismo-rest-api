export interface Recalada {
  id: string;
  buqueId: string;
  puertoOrigenId?: string;
  puertoDestinoId?: string;
  fechaLlegada: Date;
  fechaSalida?: Date;
  numeroViaje?: string;
  observaciones?: string;
  estado: EstadoRecalada;
  createdAt: Date;
  updatedAt: Date;
  
  // Relations
  buque?: any;
  puertoOrigen?: any;
  puertoDestino?: any;
  turnos?: any[];
  atenciones?: any[];
}

export enum EstadoRecalada {
  PROGRAMADA = 'PROGRAMADA',
  EN_PUERTO = 'EN_PUERTO',
  FINALIZADA = 'FINALIZADA',
  CANCELADA = 'CANCELADA'
}

export interface CreateRecaladaDto {
  buqueId: string;
  puertoOrigenId?: string;
  puertoDestinoId?: string;
  fechaLlegada: Date;
  fechaSalida?: Date;
  numeroViaje?: string;
  observaciones?: string;
}
