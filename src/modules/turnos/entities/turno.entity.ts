import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { Atencion } from '../../atenciones/entities/atencion.entity';
import { User } from '../../users/entities/user.entity';

export enum EstadoTurno {
  DISPONIBLE = 'disponible',
  TOMADO = 'tomado',
  EN_USO = 'en_uso',
  COMPLETADO = 'completado',
  CANCELADO = 'cancelado',
  EXPIRADO = 'expirado',
}

export enum TipoTurno {
  NORMAL = 'normal',
  PRIORITARIO = 'prioritario',
  URGENTE = 'urgente',
  PROGRAMADO = 'programado',
}

@Entity('turnos')
export class Turno extends BaseEntity {
  @Column({ unique: true, length: 20 })
  codigo: string;

  @ManyToOne(() => Atencion, (atencion) => atencion.turnos, { eager: true })
  @JoinColumn({ name: 'atencion_id' })
  atencion: Atencion;

  @Column({
    type: 'enum',
    enum: TipoTurno,
    default: TipoTurno.NORMAL,
  })
  tipo: TipoTurno;

  @Column({
    type: 'enum',
    enum: EstadoTurno,
    default: EstadoTurno.DISPONIBLE,
  })
  estado: EstadoTurno;

  @Column({ name: 'numero_turno' })
  numeroTurno: number;

  @Column({ name: 'fecha_creacion' })
  fechaCreacion: Date;

  @Column({ name: 'fecha_programada', nullable: true })
  fechaProgramada: Date;

  @Column({ name: 'fecha_tomado', nullable: true })
  fechaTomado: Date;

  @Column({ name: 'fecha_inicio', nullable: true })
  fechaInicio: Date;

  @Column({ name: 'fecha_fin', nullable: true })
  fechaFin: Date;

  @Column({ name: 'fecha_expiracion', nullable: true })
  fechaExpiracion: Date;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'usuario_asignado_id' })
  usuarioAsignado: User;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'usuario_creador_id' })
  usuarioCreador: User;

  @Column({ name: 'tiempo_estimado', nullable: true })
  tiempoEstimado: number; // en minutos

  @Column({ name: 'tiempo_real', nullable: true })
  tiempoReal: number; // en minutos

  @Column({ type: 'text', nullable: true })
  observaciones: string;

  @Column({ type: 'text', nullable: true })
  notas_finalizacion: string;

  @Column({ name: 'requiere_confirmacion', default: false })
  requiereConfirmacion: boolean;

  @Column({ name: 'es_reprogramable', default: true })
  esReprogramable: boolean;
}
