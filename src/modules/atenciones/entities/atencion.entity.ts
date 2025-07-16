import { Entity, Column, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { Recalada } from '../../recaladas/entities/recalada.entity';
import { User } from '../../users/entities/user.entity';
import { Turno } from '../../turnos/entities/turno.entity';

export enum TipoAtencion {
  PRACTICAJE = 'practicaje',
  REMOLQUE = 'remolque',
  AMARRE = 'amarre',
  DESAMARRE = 'desamarre',
  CARGA = 'carga',
  DESCARGA = 'descarga',
  INSPECCION = 'inspeccion',
  APROVISIONAMIENTO = 'aprovisionamiento',
  OTROS = 'otros',
}

export enum EstadoAtencion {
  PENDIENTE = 'pendiente',
  EN_PROCESO = 'en_proceso',
  COMPLETADA = 'completada',
  CANCELADA = 'cancelada',
  SUSPENDIDA = 'suspendida',
}

export enum PrioridadAtencion {
  BAJA = 'baja',
  NORMAL = 'normal',
  ALTA = 'alta',
  URGENTE = 'urgente',
}

@Entity('atenciones')
export class Atencion extends BaseEntity {
  @Column({ unique: true, length: 20 })
  codigo: string;

  @ManyToOne(() => Recalada, (recalada) => recalada.atenciones, { eager: true })
  @JoinColumn({ name: 'recalada_id' })
  recalada: Recalada;

  @Column({
    type: 'enum',
    enum: TipoAtencion,
  })
  tipo: TipoAtencion;

  @Column({ length: 200 })
  descripcion: string;

  @Column({
    type: 'enum',
    enum: EstadoAtencion,
    default: EstadoAtencion.PENDIENTE,
  })
  estado: EstadoAtencion;

  @Column({
    type: 'enum',
    enum: PrioridadAtencion,
    default: PrioridadAtencion.NORMAL,
  })
  prioridad: PrioridadAtencion;

  @Column({ name: 'fecha_programada' })
  fechaProgramada: Date;

  @Column({ name: 'fecha_inicio', nullable: true })
  fechaInicio: Date;

  @Column({ name: 'fecha_fin', nullable: true })
  fechaFin: Date;

  @Column({ name: 'duracion_estimada', nullable: true })
  duracionEstimada: number; // en minutos

  @Column({ name: 'duracion_real', nullable: true })
  duracionReal: number; // en minutos

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'responsable_id' })
  responsable: User;

  @Column({ type: 'text', nullable: true })
  observaciones: string;

  @Column({ type: 'text', nullable: true })
  requisitos: string;

  @OneToMany(() => Turno, (turno) => turno.atencion)
  turnos: Turno[];
}
