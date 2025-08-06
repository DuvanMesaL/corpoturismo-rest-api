import { TurnoRepository } from '../../domain/repositories/TurnoRepository';
import { TurnoRepositoryImpl } from '../../infrastructure/repositories/TurnoRepositoryImpl';
import { logger, auditLogger } from '../../infrastructure/logging/winston-logger';
import { CreateTurnoDto, Turno, EstadoTurno } from '../../domain/entities/Turno';

export interface TurnoActionResult {
  success: boolean;
  turno?: Turno;
  error?: string;
}

export class TurnoService {
  private turnoRepository: TurnoRepository;

  constructor() {
    this.turnoRepository = new TurnoRepositoryImpl();
  }

  async createTurno(
    turnoData: CreateTurnoDto,
    creatorInfo: { id: string; email: string }
  ): Promise<TurnoActionResult> {
    try {
      // Validar que la fecha de inicio sea anterior a la fecha de fin
      if (turnoData.fechaInicio >= turnoData.fechaFin) {
        return {
          success: false,
          error: 'La fecha de inicio debe ser anterior a la fecha de fin'
        };
      }

      // Validar que las fechas no sean en el pasado
      const now = new Date();
      if (turnoData.fechaInicio < now) {
        return {
          success: false,
          error: 'No se pueden crear turnos en el pasado'
        };
      }

      const turno = await this.turnoRepository.create({
        ...turnoData,
        creadorId: creatorInfo.id
      });

      auditLogger.log({
        usuario_id: creatorInfo.id,
        accion: 'crear_turno',
        tipo: 'exito',
        entidad_afectada: 'turnos',
        mensaje: `Turno creado para recalada ${turnoData.recaladaId}`,
        detalles: {
          turno_id: turno.id,
          recalada_id: turnoData.recaladaId,
          fecha_inicio: turnoData.fechaInicio,
          fecha_fin: turnoData.fechaFin
        }
      });

      return {
        success: true,
        turno
      };
    } catch (error) {
      logger.error('Error en TurnoService.createTurno:', error);
      return {
        success: false,
        error: 'Error interno del servidor'
      };
    }
  }

  async tomarTurno(
    turnoId: string,
    guiaInfo: { id: string; email: string; nombre: string }
  ): Promise<TurnoActionResult> {
    try {
      // Verificar que el turno existe y está disponible
      const turnoExistente = await this.turnoRepository.findById(turnoId);
      
      if (!turnoExistente) {
        return {
          success: false,
          error: 'Turno no encontrado'
        };
      }

      if (turnoExistente.estado !== EstadoTurno.DISPONIBLE) {
        return {
          success: false,
          error: `El turno no está disponible. Estado actual: ${turnoExistente.estado}`
        };
      }

      // Verificar que el guía no tenga turnos conflictivos
      const turnosConflictivos = await this.turnoRepository.findByGuia(guiaInfo.id, {
        estado: EstadoTurno.TOMADO
      });

      const hayConflicto = turnosConflictivos.some(turno => {
        return (
          (turnoExistente.fechaInicio >= turno.fechaInicio && turnoExistente.fechaInicio < turno.fechaFin) ||
          (turnoExistente.fechaFin > turno.fechaInicio && turnoExistente.fechaFin <= turno.fechaFin) ||
          (turnoExistente.fechaInicio <= turno.fechaInicio && turnoExistente.fechaFin >= turno.fechaFin)
        );
      });

      if (hayConflicto) {
        return {
          success: false,
          error: 'Ya tienes un turno asignado en ese horario'
        };
      }

      const turno = await this.turnoRepository.tomarTurno(turnoId, guiaInfo.id);

      auditLogger.log({
        usuario_id: guiaInfo.id,
        accion: 'tomar_turno',
        tipo: 'exito',
        entidad_afectada: 'turnos',
        mensaje: `Turno tomado por ${guiaInfo.nombre}`,
        detalles: {
          turno_id: turnoId,
          guia_id: guiaInfo.id,
          recalada_id: turno.recaladaId,
          buque: turno.recalada?.buque?.nombre
        }
      });

      return {
        success: true,
        turno
      };
    } catch (error) {
      logger.error('Error en TurnoService.tomarTurno:', error);
      return {
        success: false,
        error: 'Error interno del servidor'
      };
    }
  }

  async usarTurno(
    turnoId: string,
    usuarioInfo: { id: string; email: string; nombre: string },
    observaciones?: string
  ): Promise<TurnoActionResult> {
    try {
      const turnoExistente = await this.turnoRepository.findById(turnoId);
      
      if (!turnoExistente) {
        return {
          success: false,
          error: 'Turno no encontrado'
        };
      }

      // Verificar que el usuario puede usar este turno
      if (turnoExistente.guiaId !== usuarioInfo.id) {
        return {
          success: false,
          error: 'Solo el guía asignado puede usar este turno'
        };
      }

      if (turnoExistente.estado !== EstadoTurno.TOMADO) {
        return {
          success: false,
          error: `El turno no puede ser usado. Estado actual: ${turnoExistente.estado}`
        };
      }

      const turno = await this.turnoRepository.usarTurno(turnoId, observaciones);

      auditLogger.log({
        usuario_id: usuarioInfo.id,
        accion: 'usar_turno',
        tipo: 'exito',
        entidad_afectada: 'turnos',
        mensaje: `Turno iniciado por ${usuarioInfo.nombre}`,
        detalles: {
          turno_id: turnoId,
          observaciones,
          buque: turno.recalada?.buque?.nombre
        }
      });

      return {
        success: true,
        turno
      };
    } catch (error) {
      logger.error('Error en TurnoService.usarTurno:', error);
      return {
        success: false,
        error: 'Error interno del servidor'
      };
    }
  }

  async liberarTurno(
    turnoId: string,
    usuarioInfo: { id: string; email: string; nombre: string }
  ): Promise<TurnoActionResult> {
    try {
      const turnoExistente = await this.turnoRepository.findById(turnoId);
      
      if (!turnoExistente) {
        return {
          success: false,
          error: 'Turno no encontrado'
        };
      }

      // Verificar permisos: el guía asignado o un supervisor/admin
      const puedeLiberar = turnoExistente.guiaId === usuarioInfo.id;
      
      if (!puedeLiberar) {
        return {
          success: false,
          error: 'No tienes permisos para liberar este turno'
        };
      }

      if (![EstadoTurno.TOMADO, EstadoTurno.EN_USO].includes(turnoExistente.estado)) {
        return {
          success: false,
          error: `El turno no puede ser liberado. Estado actual: ${turnoExistente.estado}`
        };
      }

      const turno = await this.turnoRepository.liberarTurno(turnoId);

      auditLogger.log({
        usuario_id: usuarioInfo.id,
        accion: 'liberar_turno',
        tipo: 'exito',
        entidad_afectada: 'turnos',
        mensaje: `Turno liberado por ${usuarioInfo.nombre}`,
        detalles: {
          turno_id: turnoId,
          estado_anterior: turnoExistente.estado,
          buque: turno.recalada?.buque?.nombre
        }
      });

      return {
        success: true,
        turno
      };
    } catch (error) {
      logger.error('Error en TurnoService.liberarTurno:', error);
      return {
        success: false,
        error: 'Error interno del servidor'
      };
    }
  }

  async terminarTurno(
    turnoId: string,
    usuarioInfo: { id: string; email: string; nombre: string },
    horasTrabajadas?: number
  ): Promise<TurnoActionResult> {
    try {
      const turnoExistente = await this.turnoRepository.findById(turnoId);
      
      if (!turnoExistente) {
        return {
          success: false,
          error: 'Turno no encontrado'
        };
      }

      if (turnoExistente.guiaId !== usuarioInfo.id) {
        return {
          success: false,
          error: 'Solo el guía asignado puede terminar este turno'
        };
      }

      if (turnoExistente.estado !== EstadoTurno.EN_USO) {
        return {
          success: false,
          error: `El turno no puede ser terminado. Estado actual: ${turnoExistente.estado}`
        };
      }

      // Calcular horas trabajadas si no se proporcionan
      let horasCalculadas = horasTrabajadas;
      if (!horasCalculadas) {
        const duracionMs = turnoExistente.fechaFin.getTime() - turnoExistente.fechaInicio.getTime();
        horasCalculadas = Math.round((duracionMs / (1000 * 60 * 60)) * 100) / 100; // Redondear a 2 decimales
      }

      const turno = await this.turnoRepository.terminarTurno(turnoId, horasCalculadas);

      auditLogger.log({
        usuario_id: usuarioInfo.id,
        accion: 'terminar_turno',
        tipo: 'exito',
        entidad_afectada: 'turnos',
        mensaje: `Turno terminado por ${usuarioInfo.nombre}`,
        detalles: {
          turno_id: turnoId,
          horas_trabajadas: horasCalculadas,
          buque: turno.recalada?.buque?.nombre
        }
      });

      return {
        success: true,
        turno
      };
    } catch (error) {
      logger.error('Error en TurnoService.terminarTurno:', error);
      return {
        success: false,
        error: 'Error interno del servidor'
      };
    }
  }

  async cancelarTurno(
    turnoId: string,
    usuarioInfo: { id: string; email: string; nombre: string },
    motivo?: string
  ): Promise<TurnoActionResult> {
    try {
      const turnoExistente = await this.turnoRepository.findById(turnoId);
      
      if (!turnoExistente) {
        return {
          success: false,
          error: 'Turno no encontrado'
        };
      }

      if (turnoExistente.estado === EstadoTurno.FINALIZADO) {
        return {
          success: false,
          error: 'No se puede cancelar un turno ya finalizado'
        };
      }

      const turno = await this.turnoRepository.cancelarTurno(turnoId, motivo);

      auditLogger.log({
        usuario_id: usuarioInfo.id,
        accion: 'cancelar_turno',
        tipo: 'advertencia',
        entidad_afectada: 'turnos',
        mensaje: `Turno cancelado por ${usuarioInfo.nombre}`,
        detalles: {
          turno_id: turnoId,
          motivo,
          estado_anterior: turnoExistente.estado,
          buque: turno.recalada?.buque?.nombre
        }
      });

      return {
        success: true,
        turno
      };
    } catch (error) {
      logger.error('Error en TurnoService.cancelarTurno:', error);
      return {
        success: false,
        error: 'Error interno del servidor'
      };
    }
  }

  async getTurnos(filters?: {
    estado?: EstadoTurno;
    guiaId?: string;
    recaladaId?: string;
    fechaInicio?: Date;
    fechaFin?: Date;
    page?: number;
    limit?: number;
  }) {
    try {
      return await this.turnoRepository.findAll(filters);
    } catch (error) {
      logger.error('Error en TurnoService.getTurnos:', error);
      throw error;
    }
  }

  async getTurnoById(id: string) {
    try {
      return await this.turnoRepository.findById(id);
    } catch (error) {
      logger.error('Error en TurnoService.getTurnoById:', error);
      throw error;
    }
  }

  async getTurnosDisponibles(filters?: {
    fechaInicio?: Date;
    fechaFin?: Date;
    recaladaId?: string;
  }) {
    try {
      return await this.turnoRepository.findAvailable(filters);
    } catch (error) {
      logger.error('Error en TurnoService.getTurnosDisponibles:', error);
      throw error;
    }
  }

  async getTurnosByGuia(guiaId: string, filters?: {
    estado?: EstadoTurno;
    fechaInicio?: Date;
    fechaFin?: Date;
  }) {
    try {
      return await this.turnoRepository.findByGuia(guiaId, filters);
    } catch (error) {
      logger.error('Error en TurnoService.getTurnosByGuia:', error);
      throw error;
    }
  }
}
