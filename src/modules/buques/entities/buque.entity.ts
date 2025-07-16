import { Entity, Column, OneToMany } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { Recalada } from '../../recaladas/entities/recalada.entity';

export enum TipoBuque {
  CARGA = 'carga',
  PASAJEROS = 'pasajeros',
  TANQUERO = 'tanquero',
  CONTENEDORES = 'contenedores',
  GRANELERO = 'granelero',
  PESQUERO = 'pesquero',
  OTROS = 'otros',
}

export enum EstadoBuque {
  ACTIVO = 'activo',
  INACTIVO = 'inactivo',
  MANTENIMIENTO = 'mantenimiento',
}

@Entity('buques')
export class Buque extends BaseEntity {
  @Column({ unique: true, length: 20 })
  codigo: string;

  @Column({ length: 100 })
  nombre: string;

  @Column({ length: 50, nullable: true })
  bandera: string;

  @Column({ length: 20, nullable: true })
  imo: string;

  @Column({ length: 20, nullable: true })
  mmsi: string;

  @Column({
    type: 'enum',
    enum: TipoBuque,
    default: TipoBuque.CARGA,
  })
  tipo: TipoBuque;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  eslora: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  manga: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  calado: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  tonelaje: number;

  @Column({ length: 100, nullable: true })
  armador: string;

  @Column({ length: 100, nullable: true })
  agente: string;

  @Column({
    type: 'enum',
    enum: EstadoBuque,
    default: EstadoBuque.ACTIVO,
  })
  estado: EstadoBuque;

  @Column({ type: 'text', nullable: true })
  observaciones: string;

  @OneToMany(() => Recalada, (recalada) => recalada.buque)
  recaladas: Recalada[];
}
