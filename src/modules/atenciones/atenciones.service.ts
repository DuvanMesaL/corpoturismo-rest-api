import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type { Repository } from 'typeorm';
import {
  Atencion,
  type EstadoAtencion,
  type TipoAtencion,
  type PrioridadAtencion,
} from './entities/atencion.entity';
import type { CreateAtencionDto } from './dto/create-atencion.dto';
import type { UpdateAtencionDto } from './dto/update-atencion.dto';
import type { ChangeStatusAtencionDto } from './dto/change-status-atencion.dto';
import type { RecaladasService } from '../recaladas/recaladas.service';
import type { UsersService } from '../users/users.service';
import type { LogsService } from '../logs/logs.service';

@Injectable()
export class AtencionesService {
  constructor(
    @InjectRepository(Atencion)
    private atencionRepository: Repository<Atencion>,
    private recaladasService: RecaladasService,
    private usersService: UsersService,
    private logsService: LogsService,
  ) {}

  async create(
    createAtencionDto: CreateAtencionDto,
    userId: number,
  ): Promise<Atencion> {
    // Verificar si el código ya existe
    const existingAtencion = await this.atencionRepository.findOne({
      where: { codigo: createAtencionDto.codigo },
    });

    if (existingAtencion) {
      throw new ConflictException(
        `Ya existe una atención con el código ${createAtencionDto.codigo}`,
      );
    }

    // Verificar que la recalada existe
    const recalada = await this.recaladasService.findOne(
      createAtencionDto.recaladaId,
    );

    // Verificar responsable si se especifica
    let responsable = null;
    if (createAtencionDto.responsableId) {
      responsable = await this.usersService.findOne(
        createAtencionDto.responsableId,
      );
    }

    // Validaciones de negocio
    this.validateAtencionDates(createAtencionDto);
    await this.validateAtencionForRecalada(
      recalada.id,
      createAtencionDto.tipo,
      createAtencionDto.fechaProgramada,
    );

    const atencion = this.atencionRepository.create({
      ...createAtencionDto,
      recalada,
      responsable,
    });

    const savedAtencion = await this.atencionRepository.save(atencion);

    // Log de creación
    await this.logsService.createLog({
      action: 'ATENCION_CREATED',
      userId,
      entityType: 'Atencion',
      entityId: savedAtencion.id.toString(),
      message: `Atención ${savedAtencion.codigo} creada para recalada ${recalada.codigo}`,
      metadata: {
        atencionData: createAtencionDto,
        recaladaCodigo: recalada.codigo,
      },
    });

    return savedAtencion;
  }

  async findAll(filters?: {
    estado?: EstadoAtencion;
    tipo?: TipoAtencion;
    prioridad?: PrioridadAtencion;
    recaladaId?: number;
    responsableId?: number;
    fechaDesde?: Date;
    fechaHasta?: Date;
  }): Promise<Atencion[]> {
    const query = this.atencionRepository
      .createQueryBuilder('atencion')
      .leftJoinAndSelect('atencion.recalada', 'recalada')
      .leftJoinAndSelect('recalada.buque', 'buque')
      .leftJoinAndSelect('atencion.responsable', 'responsable')
      .leftJoinAndSelect('atencion.turnos', 'turnos');

    if (filters?.estado) {
      query.andWhere('atencion.estado = :estado', { estado: filters.estado });
    }

    if (filters?.tipo) {
      query.andWhere('atencion.tipo = :tipo', { tipo: filters.tipo });
    }

    if (filters?.prioridad) {
      query.andWhere('atencion.prioridad = :prioridad', {
        prioridad: filters.prioridad,
      });
    }

    if (filters?.recaladaId) {
      query.andWhere('atencion.recalada.id = :recaladaId', {
        recaladaId: filters.recaladaId,
      });
    }

    if (filters?.responsableId) {
      query.andWhere('atencion.responsable.id = :responsableId', {
        responsableId: filters.responsableId,
      });
    }

    if (filters?.fechaDesde) {
      query.andWhere('atencion.fechaProgramada >= :fechaDesde', {
        fechaDesde: filters.fechaDesde,
      });
    }

    if (filters?.fechaHasta) {
      query.andWhere('atencion.fechaProgramada <= :fechaHasta', {
        fechaHasta: filters.fechaHasta,
      });
    }

    return await query
      .orderBy('atencion.prioridad', 'DESC')
      .addOrderBy('atencion.fechaProgramada', 'ASC')
      .getMany();
  }

  async findPendientes(): Promise<Atencion[]> {
    return this.findAll({ estado: 'pendiente' as EstadoAtencion });
  }

  async findByResponsable(responsableId: number): Promise<Atencion[]> {
    return this.findAll({ responsableId });
  }

  async findOne(id: number): Promise<Atencion> {
    const atencion = await this.atencionRepository.findOne({
      where: { id },
      relations: [
        'recalada',
        'recalada.buque',
        'responsable',
        'turnos',
        'turnos.usuarioAsignado',
      ],
    });

    if (!atencion) {
      throw new NotFoundException(`Atención con ID ${id} no encontrada`);
    }

    return atencion;
  }

  async findByCode(codigo: string): Promise<Atencion> {
    const atencion = await this.atencionRepository.findOne({
      where: { codigo },
      relations: ['recalada', 'recalada.buque', 'responsable', 'turnos'],
    });

    if (!atencion) {
      throw new NotFoundException(
        `Atención con código ${codigo} no encontrada`,
      );
    }

    return atencion;
  }

  async update(
    id: number,
    updateAtencionDto: UpdateAtencionDto,
    userId: number,
  ): Promise<Atencion> {
    const atencion = await this.findOne(id);

    // Si se está cambiando el código, verificar que no exista
    if (
      updateAtencionDto.codigo &&
      updateAtencionDto.codigo !== atencion.codigo
    ) {
      const existingAtencion = await this.atencionRepository.findOne({
        where: { codigo: updateAtencionDto.codigo },
      });

      if (existingAtencion) {
        throw new ConflictException(
          `Ya existe una atención con el código ${updateAtencionDto.codigo}`,
        );
      }
    }

    // Si se está cambiando la recalada, verificar que existe
    if (
      updateAtencionDto.recaladaId &&
      updateAtencionDto.recaladaId !== atencion.recalada.id
    ) {
      const recalada = await this.recaladasService.findOne(
        updateAtencionDto.recaladaId,
      );
      atencion.recalada = recalada;
    }

    // Si se está cambiando el responsable, verificar que existe
    if (
      updateAtencionDto.responsableId &&
      updateAtencionDto.responsableId !== atencion.responsable?.id
    ) {
      const responsable = await this.usersService.findOne(
        updateAtencionDto.responsableId,
      );
      atencion.responsable = responsable;
    }

    const previousData = { ...atencion };
    Object.assign(atencion, updateAtencionDto);
    const updatedAtencion = await this.atencionRepository.save(atencion);

    // Log de actualización
    await this.logsService.createLog({
      action: 'ATENCION_UPDATED',
      userId,
      entityType: 'Atencion',
      entityId: updatedAtencion.id.toString(),
      message: `Atención ${updatedAtencion.codigo} actualizada`,
      metadata: {
        previousData,
        newData: updateAtencionDto,
      },
    });

    return updatedAtencion;
  }

  async changeStatus(
    id: number,
    changeStatusDto: ChangeStatusAtencionDto,
    userId: number,
  ): Promise<Atencion> {
    const atencion = await this.findOne(id);
    const previousStatus = atencion.estado;

    // Validar transición de estado
    this.validateStatusTransition(previousStatus, changeStatusDto.estado);

    // Actualizar fechas según el nuevo estado
    const now = new Date();
    switch (changeStatusDto.estado) {
      case 'en_proceso':
        if (!atencion.fechaInicio) {
          atencion.fechaInicio = changeStatusDto.fechaInicio || now;
        }
        break;
      case 'completada':
        if (!atencion.fechaFin) {
          atencion.fechaFin = changeStatusDto.fechaFin || now;
        }
        // Calcular duración real
        if (atencion.fechaInicio && atencion.fechaFin) {
          const duracionReal = Math.floor(
            (atencion.fechaFin.getTime() - atencion.fechaInicio.getTime()) /
              (1000 * 60),
          );
          atencion.duracionReal = duracionReal;
        }
        break;
    }

    atencion.estado = changeStatusDto.estado;
    if (changeStatusDto.observaciones) {
      atencion.observaciones =
        `${atencion.observaciones || ''}\n${changeStatusDto.observaciones}`.trim();
    }

    const updatedAtencion = await this.atencionRepository.save(atencion);

    // Log de cambio de estado
    await this.logsService.createLog({
      action: 'ATENCION_STATUS_CHANGED',
      userId,
      entityType: 'Atencion',
      entityId: updatedAtencion.id.toString(),
      message: `Estado de atención ${updatedAtencion.codigo} cambiado de ${previousStatus} a ${changeStatusDto.estado}`,
      metadata: {
        previousStatus,
        newStatus: changeStatusDto.estado,
        duracionReal: updatedAtencion.duracionReal,
      },
    });

    return updatedAtencion;
  }

  async assignResponsable(
    id: number,
    responsableId: number,
    userId: number,
  ): Promise<Atencion> {
    const atencion = await this.findOne(id);
    const responsable = await this.usersService.findOne(responsableId);

    const previousResponsable = atencion.responsable;
    atencion.responsable = responsable;
    const updatedAtencion = await this.atencionRepository.save(atencion);

    // Log de asignación
    await this.logsService.createLog({
      action: 'ATENCION_ASSIGNED',
      userId,
      entityType: 'Atencion',
      entityId: updatedAtencion.id.toString(),
      message: `Atención ${updatedAtencion.codigo} asignada a ${responsable.firstName} ${responsable.firstLastname}`,
      metadata: {
        previousResponsable: previousResponsable?.email,
        newResponsable: responsable.email,
      },
    });

    return updatedAtencion;
  }

  async remove(id: number, userId: number): Promise<void> {
    const atencion = await this.findOne(id);

    // Verificar si tiene turnos activos
    const activeTurnos = atencion.turnos?.filter((turno) =>
      ['disponible', 'tomado', 'en_uso'].includes(turno.estado),
    );

    if (activeTurnos && activeTurnos.length > 0) {
      throw new ConflictException(
        'No se puede eliminar una atención con turnos activos',
      );
    }

    await this.atencionRepository.softDelete(id);

    // Log de eliminación
    await this.logsService.createLog({
      action: 'ATENCION_DELETED',
      userId,
      entityType: 'Atencion',
      entityId: atencion.id.toString(),
      message: `Atención ${atencion.codigo} eliminada`,
    });
  }

  async getEstadisticas(): Promise<any> {
    const estadisticas = await this.atencionRepository
      .createQueryBuilder('atencion')
      .select('atencion.estado', 'estado')
      .addSelect('COUNT(*)', 'cantidad')
      .groupBy('atencion.estado')
      .getRawMany();

    const estadisticasPorTipo = await this.atencionRepository
      .createQueryBuilder('atencion')
      .select('atencion.tipo', 'tipo')
      .addSelect('COUNT(*)', 'cantidad')
      .groupBy('atencion.tipo')
      .getRawMany();

    const totalAtenciones = await this.atencionRepository.count();
    const atencionesHoy = await this.atencionRepository.count({
      where: {
        fechaProgramada: new Date(),
      },
    });

    return {
      totalAtenciones,
      atencionesHoy,
      porEstado: estadisticas,
      porTipo: estadisticasPorTipo,
    };
  }

  private validateAtencionDates(data: any): void {
    if (data.fechaInicio && data.fechaFin) {
      if (data.fechaFin <= data.fechaInicio) {
        throw new BadRequestException(
          'La fecha de fin debe ser posterior a la fecha de inicio',
        );
      }
    }

    if (data.fechaProgramada && data.fechaProgramada < new Date()) {
      throw new BadRequestException(
        'La fecha programada no puede ser en el pasado',
      );
    }
  }

  private async validateAtencionForRecalada(
    recaladaId: number,
    tipo: TipoAtencion,
    fechaProgramada: Date,
  ): Promise<void> {
    // Verificar si ya existe una atención del mismo tipo para la misma recalada en la misma fecha
    const existingAtencion = await this.atencionRepository.findOne({
      where: {
        recalada: { id: recaladaId },
        tipo,
        fechaProgramada,
      },
    });

    if (existingAtencion) {
      throw new ConflictException(
        `Ya existe una atención de tipo ${tipo} programada para esta recalada en la fecha especificada`,
      );
    }
  }

  private validateStatusTransition(
    currentStatus: EstadoAtencion,
    newStatus: EstadoAtencion,
  ): void {
    const validTransitions: Record<EstadoAtencion, EstadoAtencion[]> = {
      pendiente: ['en_proceso', 'cancelada', 'suspendida'],
      en_proceso: ['completada', 'suspendida', 'cancelada'],
      completada: [],
      cancelada: [],
      suspendida: ['pendiente', 'en_proceso', 'cancelada'],
    };

    if (!validTransitions[currentStatus].includes(newStatus)) {
      throw new BadRequestException(
        `No se puede cambiar el estado de ${currentStatus} a ${newStatus}. Transiciones válidas: ${validTransitions[currentStatus].join(', ')}`,
      );
    }
  }
}
