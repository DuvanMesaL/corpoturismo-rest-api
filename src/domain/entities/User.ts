export interface User {
  id: string;
  uuid: string;
  email: string;
  password?: string;
  tipoIdentificacion?: string;
  numeroIdentificacion?: string;
  primerNombre?: string;
  segundoNombre?: string;
  primerApellido?: string;
  segundoApellido?: string;
  telefono?: string;
  rolId: string;
  estado: 'inactivo' | 'activo';
  fechaInvitacion: Date;
  fechaActivacion?: Date;
  usuarioInvitadorId?: string;
  ipRegistro?: string;
  dispositivoRegistro?: string;
  esTemporal: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateUserDto {
  email: string;
  rolId: string;
  usuarioInvitadorId: string;
}

export interface CompleteRegistrationDto {
  uuid: string;
  tipoIdentificacion: string;
  numeroIdentificacion: string;
  primerNombre: string;
  segundoNombre?: string;
  primerApellido: string;
  segundoApellido?: string;
  telefono: string;
  password: string;
  confirmPassword: string;
}

export interface LoginDto {
  email: string;
  password: string;
}
