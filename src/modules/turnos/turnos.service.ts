import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type { Repository } from 'typeorm';
import { Turno, EstadoTurno, type TipoTurno } from './entities/turno.entity';
import type { CreateTurnoDto } from './dto/create-turno.dto';
import type { TomarTurnoDto } from './dto/tomar-turno.dto';
import type { LogsService } from '../logs/logs.service';
import type { AtencionesService } from '../atenciones/atenciones.service';

@Injectable()
export class TurnosService {
  constructor(
    @InjectRepository(Turno)
    private turnoRepository: Repository<Turno>,
    private logsService: LogsService,
    private atencionesService: AtencionesService,
  ) {}

  async create(createTurnoDto: CreateTurnoDto, userId: number): Promise<Turno> {
    // Verificar que la atención existe
    const atencion = await this.atencionesService.findOne(
      createTurnoDto.atencionId,
    );

    // Generar código único para el turno
    const codigo = await this.generateTurnoCode(atencion.id);

    // Obtener siguiente número de turno para esta atención
    const numeroTurno = await this.getNextTurnoNumber(atencion.id);

    // Calcular fecha de expiración (por defecto 2 horas)
    const fechaExpiracion = new Date();
    fechaExpiracion.setHours(fechaExpiracion.getHours() + 2);

    const turno = this.turnoRepository.create({
      ...createTurnoDto,
      codigo,
      numeroTurno,
      atencion,
      fechaCreacion: new Date(),
      fechaExpiracion,
      usuarioCreador: { id: userId },
      estado: EstadoTurno.DISPONIBLE,
    });

    const savedTurno = await this.turnoRepository.save(turno);

    // Log de creación
    await this.logsService.createLog({
      action: 'TURNO_CREATED',
      userId,
      entityType: 'Turno',
      entityId: savedTurno.id.toString(),
      message: `Turno ${savedTurno.codigo} creado para atención ${atencion.codigo}`,
      metadata: {
        turnoData: createTurnoDto,
        numeroTurno: savedTurno.numeroTurno,
      },
    });

    return savedTurno;
  }

  async findAll(filters?: {
    estado?: EstadoTurno;
    tipo?: TipoTurno;
    atencionId?: number;
    usuarioId?: number;
    fecha?: Date;
  }): Promise<Turno[]> {
    const query = this.turnoRepository
      .createQueryBuilder('turno')
      .leftJoinAndSelect('turno.atencion', 'atencion')
      .leftJoinAndSelect('atencion.recalada', 'recalada')
      .leftJoinAndSelect('recalada.buque', 'buque')
      .leftJoinAndSelect('turno.usuarioAsignado', 'usuarioAsignado')
      .leftJoinAndSelect('turno.usuarioCreador', 'usuarioCreador');

    if (filters?.estado) {
      query.andWhere('turno.estado = :estado', { estado: filters.estado });
    }

    if (filters?.tipo) {
      query.andWhere('turno.tipo = :tipo', { tipo: filters.tipo });
    }

    if (filters?.atencionId) {
      query.andWhere('turno.atencion.id = :atencionId', {
        atencionId: filters.atencionId,
      });
    }

    if (filters?.usuarioId) {
      query.andWhere('turno.usuarioAsignado.id = :usuarioId', {
        usuarioId: filters.usuarioId,
      });
    }

    if (filters?.fecha) {
      const startOfDay = new Date(filters.fecha);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(filters.fecha);
      endOfDay.setHours(23, 59, 59, 999);

      query.andWhere('turno.fechaCreacion BETWEEN :start AND :end', {
        start: startOfDay,
        end: endOfDay,
      });
    }

    return await query.orderBy('turno.numeroTurno', 'ASC').getMany();
  }

  async findOne(id: number): Promise<Turno> {
    const turno = await this.turnoRepository.findOne({
      where: { id },
      relations: [
        'atencion',
        'atencion.recalada',
        'atencion.recalada.buque',
        'usuarioAsignado',
        'usuarioCreador',
      ],
    });

    if (!turno) {
      throw new NotFoundException(`Turno con ID ${id} no encontrado`);
    }

    return turno;
  }

  async tomarTurno(
    id: number,
    userId: number,
    tomarTurnoDto?: TomarTurnoDto,
  ): Promise<Turno> {
    const turno = await this.findOne(id);

    // Validaciones
    if (turno.estado !== EstadoTurno.DISPONIBLE) {
      throw new BadRequestException(
        `El turno ${turno.codigo} no está disponible`,
      );
    }

    if (turno.fechaExpiracion && turno.fechaExpiracion < new Date()) {
      // Marcar como expirado
      turno.estado = EstadoTurno.EXPIRADO;
      await this.turnoRepository.save(turno);
      throw new BadRequestException(`El turno ${turno.codigo} ha expirado`);
    }

    // Verificar si el usuario ya tiene un turno activo para esta atención
    const turnoActivo = await this.turnoRepository.findOne({
      where: {
        atencion: { id: turno.atencion.id },
        usuarioAsignado: { id: userId },
        estado: EstadoTurno.TOMADO,
      },
    });

    if (turnoActivo) {
      throw new ConflictException(
        'Ya tienes un turno activo para esta atención',
      );
    }

    // Tomar el turno
    turno.estado = EstadoTurno.TOMADO;
    turno.fechaTomado = new Date();
    turno.usuarioAsignado = { id: userId };
    if (tomarTurnoDto?.observaciones) {
      turno.observaciones = tomarTurnoDto.observaciones;
    }

    const updatedTurno = await this.turnoRepository.save(turno);

    // Log de toma de turno
    await this.logsService.createLog({
      action: 'TURNO_TOMADO',
      userId,
      entityType: 'Turno',
      entityId: updatedTurno.id.toString(),
      message: `Turno ${updatedTurno.codigo} tomado`,
      metadata: {
        numeroTurno: updatedTurno.numeroTurno,
        atencion: updatedTurno.atencion.codigo,
      },
    });

    return updatedTurno;
  }

  async usarTurno(id: number, userId: number): Promise<Turno> {
    const turno = await this.findOne(id);

    // Validaciones
    if (turno.estado !== EstadoTurno.TOMADO) {
      throw new BadRequestException(
        `El turno ${turno.codigo} debe estar tomado para poder usarse`,
      );
    }

    if (turno.usuarioAsignado?.id !== userId) {
      throw new BadRequestException('Solo puedes usar turnos que hayas tomado');
    }

    // Usar el turno
    turno.estado = EstadoTurno.EN_USO;
    turno.fechaInicio = new Date();

    const updatedTurno = await this.turnoRepository.save(turno);

    // Log de uso de turno
    await this.logsService.createLog({
      action: 'TURNO_EN_USO',
      userId,
      entityType: 'Turno',
      entityId: updatedTurno.id.toString(),
      message: `Turno ${updatedTurno.codigo} en uso`,
    });

    return updatedTurno;
  }

  async completarTurno(
    id: number,
    userId: number,
    notasFinalizacion?: string,
  ): Promise<Turno> {
    const turno = await this.findOne(id);

    // Validaciones
    if (turno.estado !== EstadoTurno.EN_USO) {
      throw new BadRequestException(
        `El turno ${turno.codigo} debe estar en uso para completarse`,
      );
    }

    if (turno.usuarioAsignado?.id !== userId) {
      throw new BadRequestException(
        'Solo puedes completar turnos que estés usando',
      );
    }

    // Completar el turno
    turno.estado = EstadoTurno.COMPLETADO;
    turno.fechaFin = new Date();
    turno.notasFinalizacion = notasFinalizacion;

    // Calcular tiempo real
    if (turno.fechaInicio) {
      const tiempoReal = Math.floor(
        (turno.fechaFin.getTime() - turno.fechaInicio.getTime()) / (1000 * 60),
      );
      turno.tiempoReal = tiempoReal;
    }

    const updatedTurno = await this.turnoRepository.save(turno);

    // Log de completado
    await this.logsService.createLog({
      action: 'TURNO_COMPLETADO',
      userId,
      entityType: 'Turno',
      entityId: updatedTurno.id.toString(),
      message: `Turno ${updatedTurno.codigo} completado`,
      metadata: {
        tiempoReal: updatedTurno.tiempoReal,
        notasFinalizacion,
      },
    });

    return updatedTurno;
  }

  async liberarTurno(
    id: number,
    userId: number,
    motivo?: string,
  ): Promise<Turno> {
    const turno = await this.findOne(id);

    // Validaciones
    if (![EstadoTurno.TOMADO, EstadoTurno.EN_USO].includes(turno.estado)) {
      throw new BadRequestException(
        `El turno ${turno.codigo} no puede ser liberado en su estado actual`,
      );
    }

    if (turno.usuarioAsignado?.id !== userId) {
      throw new BadRequestException(
        'Solo puedes liberar turnos que hayas tomado',
      );
    }

    // Liberar el turno
    turno.estado = EstadoTurno.DISPONIBLE;
    turno.usuarioAsignado = null;
    turno.fechaTomado = null;
    turno.fechaInicio = null;
    if (motivo) {
      turno.observaciones =
        `${turno.observaciones || ''}\nLiberado: ${motivo}`.trim();
    }

    const updatedTurno = await this.turnoRepository.save(turno);

    // Log de liberación
    await this.logsService.createLog({
      action: 'TURNO_LIBERADO',
      userId,
      entityType: 'Turno',
      entityId: updatedTurno.id.toString(),
      message: `Turno ${updatedTurno.codigo} liberado`,
      metadata: { motivo },
    });

    return updatedTurno;
  }

  async cancelarTurno(
    id: number,
    userId: number,
    motivo: string,
  ): Promise<Turno> {
    const turno = await this.findOne(id);

    // Solo se pueden cancelar turnos disponibles o tomados
    if (![EstadoTurno.DISPONIBLE, EstadoTurno.TOMADO].includes(turno.estado)) {
      throw new BadRequestException(
        `El turno ${turno.codigo} no puede ser cancelado en su estado actual`,
      );
    }

    // Cancelar el turno
    turno.estado = EstadoTurno.CANCELADO;
    turno.observaciones =
      `${turno.observaciones || ''}\nCancelado: ${motivo}`.trim();

    const updatedTurno = await this.turnoRepository.save(turno);

    // Log de cancelación
    await this.logsService.createLog({
      action: 'TURNO_CANCELADO',
      userId,
      entityType: 'Turno',
      entityId: updatedTurno.id.toString(),
      message: `Turno ${updatedTurno.codigo} cancelado`,
      metadata: { motivo },
    });

    return updatedTurno;
  }

  private async generateTurnoCode(atencionId: number): Promise<string> {
    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
    const count = await this.turnoRepository.count({
      where: {
        atencion: { id: atencionId },
        fechaCreacion: new Date(
          today.getFullYear(),
          today.getMonth(),
          today.getDate(),
        ),
      },
    });
    return `T${dateStr}${atencionId.toString().padStart(3, '0')}${(count + 1).toString().padStart(3, '0')}`;
  }

  private async getNextTurnoNumber(atencionId: number): Promise<number> {
    const lastTurno = await this.turnoRepository.findOne({
      where: { atencion: { id: atencionId } },
      order: { numeroTurno: 'DESC' },
    });

    return (lastTurno?.numeroTurno || 0) + 1;
  }

  async expireOldTurnos(): Promise<void> {
    const now = new Date();
    const expiredTurnos = await this.turnoRepository.find({
      where: {
        estado: EstadoTurno.DISPONIBLE,
        fechaExpiracion: new Date(now.getTime() - 1000), // Menor que ahora
      },
    });

    for (const turno of expiredTurnos) {
      turno.estado = EstadoTurno.EXPIRADO;
      await this.turnoRepository.save(turno);

      await this.logsService.createLog({
        action: 'TURNO_EXPIRED',
        userId: 0,
        userEmail: 'system',
        entityType: 'Turno',
        entityId: turno.id.toString(),
        message: `Turno ${turno.codigo} expirado automáticamente`,
      });
    }
  }
}
