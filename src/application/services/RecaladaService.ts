import { RecaladaRepository } from "../../domain/repositories/RecaladaRepository";
import { RecaladaRepositoryImpl } from "../../infrastructure/repositories/RecaladaRepositoryImpl";
import {
  logger,
  auditLogger,
} from "../../infrastructure/logging/winston-logger";
import {
  CreateRecaladaDto,
  Recalada,
  EstadoRecalada,
} from "../../domain/entities/Recalada";

export interface RecaladaActionResult {
  success: boolean;
  recalada?: Recalada;
  error?: string;
}

export class RecaladaService {
  private recaladaRepository: RecaladaRepository;

  constructor() {
    this.recaladaRepository = new RecaladaRepositoryImpl();
  }

  async createRecalada(
    recaladaData: CreateRecaladaDto,
    creatorInfo: { id: string; email: string }
  ): Promise<RecaladaActionResult> {
    try {
      // Validar que la fecha de llegada no sea en el pasado
      const now = new Date();
      if (recaladaData.fechaLlegada < now) {
        return {
          success: false,
          error: "La fecha de llegada no puede ser en el pasado",
        };
      }

      // Validar que la fecha de salida sea posterior a la llegada
      if (
        recaladaData.fechaSalida &&
        recaladaData.fechaSalida <= recaladaData.fechaLlegada
      ) {
        return {
          success: false,
          error: "La fecha de salida debe ser posterior a la fecha de llegada",
        };
      }

      const recalada = await this.recaladaRepository.create(recaladaData);

      auditLogger.log({
        usuario_id: creatorInfo.id,
        accion: "crear_recalada",
        tipo: "exito",
        entidad_afectada: "recaladas",
        mensaje: `Recalada creada para buque ${recalada.buque?.nombre}`,
        detalles: {
          recalada_id: recalada.id,
          buque_id: recaladaData.buqueId,
          fecha_llegada: recaladaData.fechaLlegada,
          numero_viaje: recaladaData.numeroViaje,
        },
      });

      return {
        success: true,
        recalada,
      };
    } catch (error) {
      logger.error("Error en RecaladaService.createRecalada:", error);
      return {
        success: false,
        error: "Error interno del servidor",
      };
    }
  }

  async getRecaladasActivas(fecha?: Date) {
    try {
      return await this.recaladaRepository.findActive(fecha);
    } catch (error) {
      logger.error("Error en RecaladaService.getRecaladasActivas:", error);
      throw error;
    }
  }

  async getRecaladaById(id: string) {
    try {
      return await this.recaladaRepository.findById(id);
    } catch (error) {
      logger.error("Error en RecaladaService.getRecaladaById:", error);
      throw error;
    }
  }

  async getRecaladas(filters?: {
    estado?: EstadoRecalada;
    buqueId?: string;
    fechaInicio?: Date;
    fechaFin?: Date;
    puertoOrigenId?: string;
    puertoDestinoId?: string;
    page?: number;
    limit?: number;
  }) {
    try {
      return await this.recaladaRepository.findAll(filters);
    } catch (error) {
      logger.error("Error en RecaladaService.getRecaladas:", error);
      throw error;
    }
  }

  async getRecaladasByBuque(buqueId: string) {
    try {
      return await this.recaladaRepository.findByBuque(buqueId);
    } catch (error) {
      logger.error("Error en RecaladaService.getRecaladasByBuque:", error);
      throw error;
    }
  }

  async updateRecalada(
    id: string,
    updateData: Partial<Recalada>,
    updaterInfo: { id: string; email: string }
  ): Promise<RecaladaActionResult> {
    try {
      const recaladaExistente = await this.recaladaRepository.findById(id);

      if (!recaladaExistente) {
        return {
          success: false,
          error: "Recalada no encontrada",
        };
      }

      if (updateData.fechaLlegada && updateData.fechaSalida) {
        if (updateData.fechaSalida <= updateData.fechaLlegada) {
          return {
            success: false,
            error:
              "La fecha de salida debe ser posterior a la fecha de llegada",
          };
        }
      }

      const recalada = await this.recaladaRepository.update(id, updateData);

      auditLogger.log({
        usuario_id: updaterInfo.id,
        accion: "actualizar_recalada",
        tipo: "exito",
        entidad_afectada: "recaladas",
        mensaje: `Recalada actualizada: ${recalada.buque?.nombre}`,
        detalles: {
          recalada_id: id,
          campos_modificados: Object.keys(updateData),
          estado_anterior: recaladaExistente.estado,
          estado_nuevo: updateData.estado,
        },
      });

      return {
        success: true,
        recalada,
      };
    } catch (error) {
      logger.error("Error en RecaladaService.updateRecalada:", error);
      return {
        success: false,
        error: "Error interno del servidor",
      };
    }
  }

  async cambiarEstadoRecalada(
    id: string,
    nuevoEstado: EstadoRecalada,
    usuarioInfo: { id: string; email: string; nombre: string }
  ): Promise<RecaladaActionResult> {
    try {
      const recaladaExistente = await this.recaladaRepository.findById(id);

      if (!recaladaExistente) {
        return {
          success: false,
          error: "Recalada no encontrada",
        };
      }

      // Validar transiciones de estado válidas
      const transicionesValidas = this.getTransicionesValidas(
        recaladaExistente.estado
      );

      if (!transicionesValidas.includes(nuevoEstado)) {
        return {
          success: false,
          error: `No se puede cambiar de ${recaladaExistente.estado} a ${nuevoEstado}`,
        };
      }

      const updateData: Partial<Recalada> = { estado: nuevoEstado };

      // Si se marca como finalizada, establecer fecha de salida si no existe
      if (
        nuevoEstado === EstadoRecalada.FINALIZADA &&
        !recaladaExistente.fechaSalida
      ) {
        updateData.fechaSalida = new Date();
      }

      const recalada = await this.recaladaRepository.update(id, updateData);

      auditLogger.log({
        usuario_id: usuarioInfo.id,
        accion: "cambiar_estado_recalada",
        tipo: "exito",
        entidad_afectada: "recaladas",
        mensaje: `Estado de recalada cambiado por ${usuarioInfo.nombre}`,
        detalles: {
          recalada_id: id,
          buque: recalada.buque?.nombre,
          estado_anterior: recaladaExistente.estado,
          estado_nuevo: nuevoEstado,
        },
      });

      return {
        success: true,
        recalada,
      };
    } catch (error) {
      logger.error("Error en RecaladaService.cambiarEstadoRecalada:", error);
      return {
        success: false,
        error: "Error interno del servidor",
      };
    }
  }

  async deleteRecalada(id: string, deleterInfo: { id: string; email: string }) {
    try {
      const recalada = await this.recaladaRepository.findById(id);

      if (!recalada) {
        throw new Error("Recalada no encontrada");
      }

      // No permitir eliminar recaladas con turnos activos
      const tieneTurnosActivos = recalada.turnos?.some((turno) =>
        ["TOMADO", "EN_USO"].includes(turno.estado)
      );

      if (tieneTurnosActivos) {
        throw new Error("No se puede eliminar una recalada con turnos activos");
      }

      await this.recaladaRepository.delete(id);

      auditLogger.log({
        usuario_id: deleterInfo.id,
        accion: "eliminar_recalada",
        tipo: "exito",
        entidad_afectada: "recaladas",
        mensaje: `Recalada eliminada: ${recalada.buque?.nombre}`,
        detalles: {
          recalada_id: id,
          buque: recalada.buque?.nombre,
          fecha_llegada: recalada.fechaLlegada,
        },
      });

      logger.info(`🗑️ Recalada eliminada: ${recalada.buque?.nombre}`);
    } catch (error) {
      logger.error("Error en RecaladaService.deleteRecalada:", error);
      throw error;
    }
  }

  private getTransicionesValidas(
    estadoActual: EstadoRecalada
  ): EstadoRecalada[] {
    const transiciones: Record<EstadoRecalada, EstadoRecalada[]> = {
      [EstadoRecalada.PROGRAMADA]: [
        EstadoRecalada.EN_PUERTO,
        EstadoRecalada.CANCELADA,
      ],
      [EstadoRecalada.EN_PUERTO]: [
        EstadoRecalada.FINALIZADA,
        EstadoRecalada.CANCELADA,
      ],
      [EstadoRecalada.FINALIZADA]: [], // Estado final
      [EstadoRecalada.CANCELADA]: [EstadoRecalada.PROGRAMADA], // Puede reactivarse
    };

    return transiciones[estadoActual] || [];
  }
}
