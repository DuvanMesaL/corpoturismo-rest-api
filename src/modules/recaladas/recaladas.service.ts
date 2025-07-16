import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type { Repository } from 'typeorm';
import {
  Recalada,
  type EstadoRecalada,
  type TipoOperacion,
} from './entities/recalada.entity';
import type { CreateRecaladaDto } from './dto/create-recalada.dto';
import type { UpdateRecaladaDto } from './dto/update-recalada.dto';
import type { ChangeStatusRecaladaDto } from './dto/change-status-recalada.dto';
import type { BuquesService } from '../buques/buques.service';
import type { LogsService } from '../logs/logs.service';

@Injectable()
export class RecaladasService {
  constructor(
    @InjectRepository(Recalada)
    private recaladaRepository: Repository<Recalada>,
    private buquesService: BuquesService,
    private logsService: LogsService,
  ) {}

  async create(
    createRecaladaDto: CreateRecaladaDto,
    userId: number,
  ): Promise<Recalada> {
    // Verificar si el código ya existe
    const existingRecalada = await this.recaladaRepository.findOne({
      where: { codigo: createRecaladaDto.codigo },
    });

    if (existingRecalada) {
      throw new ConflictException(
        `Ya existe una recalada con el código ${createRecaladaDto.codigo}`,
      );
    }

    // Verificar que el buque existe
    const buque = await this.buquesService.findOne(createRecaladaDto.buqueId);

    // Validaciones de negocio
    this.validateRecaladaDates(createRecaladaDto);
    await this.validateMuelleAvailability(
      createRecaladaDto.muelle,
      createRecaladaDto.fechaArriboProgramada,
    );

    const recalada = this.recaladaRepository.create({
      ...createRecaladaDto,
      buque,
    });

    const savedRecalada = await this.recaladaRepository.save(recalada);

    // Log de creación
    await this.logsService.createLog({
      action: 'RECALADA_CREATED',
      userId,
      entityType: 'Recalada',
      entityId: savedRecalada.id.toString(),
      message: `Recalada ${savedRecalada.codigo} creada para buque ${buque.nombre}`,
      metadata: {
        recaladaData: createRecaladaDto,
        buqueNombre: buque.nombre,
      },
    });

    return savedRecalada;
  }

  async findAll(filters?: {
    estado?: EstadoRecalada;
    buqueId?: number;
    muelle?: string;
    fechaDesde?: Date;
    fechaHasta?: Date;
    tipoOperacion?: TipoOperacion;
  }): Promise<Recalada[]> {
    const query = this.recaladaRepository
      .createQueryBuilder('recalada')
      .leftJoinAndSelect('recalada.buque', 'buque')
      .leftJoinAndSelect('recalada.atenciones', 'atenciones');

    if (filters?.estado) {
      query.andWhere('recalada.estado = :estado', { estado: filters.estado });
    }

    if (filters?.buqueId) {
      query.andWhere('recalada.buque.id = :buqueId', {
        buqueId: filters.buqueId,
      });
    }

    if (filters?.muelle) {
      query.andWhere('recalada.muelle = :muelle', { muelle: filters.muelle });
    }

    if (filters?.tipoOperacion) {
      query.andWhere('recalada.tipoOperacion = :tipoOperacion', {
        tipoOperacion: filters.tipoOperacion,
      });
    }

    if (filters?.fechaDesde) {
      query.andWhere('recalada.fechaArriboProgramada >= :fechaDesde', {
        fechaDesde: filters.fechaDesde,
      });
    }

    if (filters?.fechaHasta) {
      query.andWhere('recalada.fechaArriboProgramada <= :fechaHasta', {
        fechaHasta: filters.fechaHasta,
      });
    }

    return await query
      .orderBy('recalada.fechaArriboProgramada', 'ASC')
      .getMany();
  }

  async findActive(): Promise<Recalada[]> {
    return this.findAll({
      estado: 'programada' as EstadoRecalada,
    });
  }

  async findByMuelle(muelle: string): Promise<Recalada[]> {
    return this.findAll({ muelle });
  }

  async findOne(id: number): Promise<Recalada> {
    const recalada = await this.recaladaRepository.findOne({
      where: { id },
      relations: ['buque', 'atenciones', 'atenciones.turnos'],
    });

    if (!recalada) {
      throw new NotFoundException(`Recalada con ID ${id} no encontrada`);
    }

    return recalada;
  }

  async findByCode(codigo: string): Promise<Recalada> {
    const recalada = await this.recaladaRepository.findOne({
      where: { codigo },
      relations: ['buque', 'atenciones'],
    });

    if (!recalada) {
      throw new NotFoundException(
        `Recalada con código ${codigo} no encontrada`,
      );
    }

    return recalada;
  }

  async update(
    id: number,
    updateRecaladaDto: UpdateRecaladaDto,
    userId: number,
  ): Promise<Recalada> {
    const recalada = await this.findOne(id);

    // Si se está cambiando el código, verificar que no exista
    if (
      updateRecaladaDto.codigo &&
      updateRecaladaDto.codigo !== recalada.codigo
    ) {
      const existingRecalada = await this.recaladaRepository.findOne({
        where: { codigo: updateRecaladaDto.codigo },
      });

      if (existingRecalada) {
        throw new ConflictException(
          `Ya existe una recalada con el código ${updateRecaladaDto.codigo}`,
        );
      }
    }

    // Si se está cambiando el buque, verificar que existe
    if (
      updateRecaladaDto.buqueId &&
      updateRecaladaDto.buqueId !== recalada.buque.id
    ) {
      const buque = await this.buquesService.findOne(updateRecaladaDto.buqueId);
      recalada.buque = buque;
    }

    // Validaciones de fechas si se están actualizando
    if (
      updateRecaladaDto.fechaArriboProgramada ||
      updateRecaladaDto.fechaZarpeProgramada
    ) {
      this.validateRecaladaDates({
        ...recalada,
        ...updateRecaladaDto,
      });
    }

    const previousData = { ...recalada };
    Object.assign(recalada, updateRecaladaDto);
    const updatedRecalada = await this.recaladaRepository.save(recalada);

    // Log de actualización
    await this.logsService.createLog({
      action: 'RECALADA_UPDATED',
      userId,
      entityType: 'Recalada',
      entityId: updatedRecalada.id.toString(),
      message: `Recalada ${updatedRecalada.codigo} actualizada`,
      metadata: {
        previousData,
        newData: updateRecaladaDto,
      },
    });

    return updatedRecalada;
  }

  async changeStatus(
    id: number,
    changeStatusDto: ChangeStatusRecaladaDto,
    userId: number,
  ): Promise<Recalada> {
    const recalada = await this.findOne(id);
    const previousStatus = recalada.estado;

    // Validar transición de estado
    this.validateStatusTransition(previousStatus, changeStatusDto.estado);

    // Actualizar fechas según el nuevo estado
    const now = new Date();
    switch (changeStatusDto.estado) {
      case 'atracada':
        if (!recalada.fechaArriboReal) {
          recalada.fechaArriboReal = now;
        }
        break;
      case 'finalizada':
        if (!recalada.fechaZarpeReal) {
          recalada.fechaZarpeReal = now;
        }
        break;
    }

    recalada.estado = changeStatusDto.estado;
    if (changeStatusDto.observaciones) {
      recalada.observaciones =
        `${recalada.observaciones || ''}\n${changeStatusDto.observaciones}`.trim();
    }

    const updatedRecalada = await this.recaladaRepository.save(recalada);

    // Log de cambio de estado
    await this.logsService.createLog({
      action: 'RECALADA_STATUS_CHANGED',
      userId,
      entityType: 'Recalada',
      entityId: updatedRecalada.id.toString(),
      message: `Estado de recalada ${updatedRecalada.codigo} cambiado de ${previousStatus} a ${changeStatusDto.estado}`,
      metadata: {
        previousStatus,
        newStatus: changeStatusDto.estado,
        observaciones: changeStatusDto.observaciones,
      },
    });

    return updatedRecalada;
  }

  async remove(id: number, userId: number): Promise<void> {
    const recalada = await this.findOne(id);

    // Verificar si tiene atenciones activas
    const activeAtenciones = recalada.atenciones?.filter((atencion) =>
      ['pendiente', 'en_proceso'].includes(atencion.estado),
    );

    if (activeAtenciones && activeAtenciones.length > 0) {
      throw new ConflictException(
        'No se puede eliminar una recalada con atenciones activas',
      );
    }

    await this.recaladaRepository.softDelete(id);

    // Log de eliminación
    await this.logsService.createLog({
      action: 'RECALADA_DELETED',
      userId,
      entityType: 'Recalada',
      entityId: recalada.id.toString(),
      message: `Recalada ${recalada.codigo} eliminada`,
    });
  }

  async getEstadisticas(): Promise<any> {
    const estadisticas = await this.recaladaRepository
      .createQueryBuilder('recalada')
      .select('recalada.estado', 'estado')
      .addSelect('COUNT(*)', 'cantidad')
      .groupBy('recalada.estado')
      .getRawMany();

    const totalRecaladas = await this.recaladaRepository.count();
    const recaladasHoy = await this.recaladaRepository.count({
      where: {
        fechaArriboProgramada: new Date(),
      },
    });

    return {
      totalRecaladas,
      recaladasHoy,
      porEstado: estadisticas,
    };
  }

  private validateRecaladaDates(data: any): void {
    if (data.fechaArriboProgramada && data.fechaZarpeProgramada) {
      if (data.fechaZarpeProgramada <= data.fechaArriboProgramada) {
        throw new BadRequestException(
          'La fecha de zarpe debe ser posterior a la fecha de arribo',
        );
      }
    }

    if (data.fechaArriboReal && data.fechaZarpeReal) {
      if (data.fechaZarpeReal <= data.fechaArriboReal) {
        throw new BadRequestException(
          'La fecha real de zarpe debe ser posterior a la fecha real de arribo',
        );
      }
    }
  }

  private async validateMuelleAvailability(
    muelle: string,
    fecha: Date,
  ): Promise<void> {
    if (!muelle) return;

    // Verificar si hay otra recalada en el mismo muelle en fechas conflictivas
    const conflictingRecalada = await this.recaladaRepository
      .createQueryBuilder('recalada')
      .where('recalada.muelle = :muelle', { muelle })
      .andWhere('recalada.estado IN (:...estados)', {
        estados: ['programada', 'en_transito', 'atracada'],
      })
      .andWhere(
        '(recalada.fechaArriboProgramada <= :fecha AND recalada.fechaZarpeProgramada >= :fecha) OR (recalada.fechaArriboProgramada = :fecha)',
        { fecha },
      )
      .getOne();

    if (conflictingRecalada) {
      throw new ConflictException(
        `El muelle ${muelle} ya está ocupado en la fecha programada`,
      );
    }
  }

  private validateStatusTransition(
    currentStatus: EstadoRecalada,
    newStatus: EstadoRecalada,
  ): void {
    const validTransitions: Record<EstadoRecalada, EstadoRecalada[]> = {
      programada: ['en_transito', 'cancelada'],
      en_transito: ['atracada', 'cancelada'],
      atracada: ['en_operacion', 'cancelada'],
      en_operacion: ['finalizada', 'atracada'],
      finalizada: [],
      cancelada: [],
    };

    if (!validTransitions[currentStatus].includes(newStatus)) {
      throw new BadRequestException(
        `No se puede cambiar el estado de ${currentStatus} a ${newStatus}. Transiciones válidas: ${validTransitions[currentStatus].join(', ')}`,
      );
    }
  }
}
