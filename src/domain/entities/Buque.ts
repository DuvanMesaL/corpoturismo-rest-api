export interface Buque {
  id: string;
  nombre: string;
  bandera?: string;
  eslora?: number;
  manga?: number;
  calado?: number;
  tonelaje?: number;
  tipoEmbarcacion?: string;
  createdAt: Date;
  updatedAt: Date;
  
  // Relations
  recaladas?: any[];
}

export interface CreateBuqueDto {
  nombre: string;
  bandera?: string;
  eslora?: number;
  manga?: number;
  calado?: number;
  tonelaje?: number;
  tipoEmbarcacion?: string;
}
