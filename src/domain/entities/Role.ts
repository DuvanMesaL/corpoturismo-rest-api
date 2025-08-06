export interface Role {
  id: string;
  nombre: string;
  descripcion?: string;
  permisos: string[];
  createdAt: Date;
  updatedAt: Date;
}

export enum RoleType {
  SUPER_ADMIN = 'super_admin',
  ADMIN = 'admin',
  SUPERVISOR = 'supervisor',
  GUIA = 'guia'
}
