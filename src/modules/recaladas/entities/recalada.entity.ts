import { Entity, Column, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { Buque } from '../../buques/entities/buque.entity';
import { Atencion } from '../../atenciones/entities/atencion.entity';

export enum EstadoRecalada {
  PROGRAMADA = 'programada',
  EN_TRANSITO = 'en_transito',
  ATRACADA = 'atracada',
  EN_OPERACION = 'en_operacion',
  FINALIZADA = 'finalizada',
  CANCELADA = 'cancelada',
}

export enum TipoOperacion {
  CARGA = 'carga',
  DESCARGA = 'descarga',
  CARGA_DESCARGA = 'carga_descarga',
  TRANSBORDO = 'transbordo',
  APROVISIONAMIENTO = 'aprovisionamiento',
  REPARACION = 'reparacion',
  OTROS = 'otros',
}

@Entity('recaladas')
export class Recalada extends BaseEntity {
  @Column({ unique: true, length: 20 })
  codigo: string;

  @ManyToOne(() => Buque, (buque) => buque.recaladas, { eager: true })
  @JoinColumn({ name: 'buque_id' })
  buque: Buque;

  @Column({ name: 'fecha_arribo_programada' })
  fechaArriboProgramada: Date;

  @Column({ name: 'fecha_arribo_real', nullable: true })
  fechaArriboReal: Date;

  @Column({ name: 'fecha_zarpe_programada', nullable: true })
  fechaZarpeProgramada: Date;

  @Column({ name: 'fecha_zarpe_real', nullable: true })
  fechaZarpeReal: Date;

  @Column({ length: 20, nullable: true })
  muelle: string;

  @Column({ length: 10, nullable: true })
  posicion: string;

  @Column({
    type: 'enum',
    enum: EstadoRecalada,
    default: EstadoRecalada.PROGRAMADA,
  })
  estado: EstadoRecalada;

  @Column({
    type: 'enum',
    enum: TipoOperacion,
    default: TipoOperacion.CARGA_DESCARGA,
  })
  tipoOperacion: TipoOperacion;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  cargaProgramada: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  cargaReal: number;

  @Column({ length: 100, nullable: true })
  mercancia: string;

  @Column({ length: 100, nullable: true })
  consignatario: string;

  @Column({ type: 'text', nullable: true })
  observaciones: string;

  @Column({ name: 'requiere_practico', default: false })
  requierePractico: boolean;

  @Column({ name: 'requiere_remolcador', default: false })
  requiereRemolcador: boolean;

  @OneToMany(() => Atencion, (atencion) => atencion.recalada)
  atenciones: Atencion[];
}
