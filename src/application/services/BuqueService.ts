import { BuqueRepository } from "../../domain/repositories/BuqueRepository";
import { BuqueRepositoryImpl } from "../../infrastructure/repositories/BuqueRepositoryImpl";
import {
  logger,
  auditLogger,
} from "../../infrastructure/logging/winston-logger";
import { CreateBuqueDto, Buque } from "../../domain/entities/Buque";

export interface BuqueActionResult {
  success: boolean;
  buque?: Buque;
  error?: string;
}

export class BuqueService {
  private buqueRepository: BuqueRepository;

  constructor() {
    this.buqueRepository = new BuqueRepositoryImpl();
  }

  async createBuque(
    buqueData: CreateBuqueDto,
    creatorInfo: { id: string; email: string }
  ): Promise<BuqueActionResult> {
    try {
      // Verificar que no exista un buque con el mismo nombre
      const buqueExistente = await this.buqueRepository.findByNombre(
        buqueData.nombre
      );

      if (buqueExistente) {
        return {
          success: false,
          error: "Ya existe un buque con este nombre",
        };
      }

      const buque = await this.buqueRepository.create(buqueData);

      auditLogger.log({
        usuario_id: creatorInfo.id,
        accion: "crear_buque",
        tipo: "exito",
        entidad_afectada: "buques",
        mensaje: `Buque creado: ${buqueData.nombre}`,
        detalles: {
          buque_id: buque.id,
          nombre: buqueData.nombre,
          bandera: buqueData.bandera,
          tipo_embarcacion: buqueData.tipoEmbarcacion,
        },
      });

      return {
        success: true,
        buque,
      };
    } catch (error) {
      logger.error("Error en BuqueService.createBuque:", error);
      return {
        success: false,
        error: "Error interno del servidor",
      };
    }
  }

  async getBuques(filters?: {
    nombre?: string;
    bandera?: string;
    tipoEmbarcacion?: string;
    page?: number;
    limit?: number;
  }) {
    try {
      return await this.buqueRepository.findAll(filters);
    } catch (error) {
      logger.error("Error en BuqueService.getBuques:", error);
      throw error;
    }
  }

  async getBuqueById(id: string) {
    try {
      return await this.buqueRepository.findById(id);
    } catch (error) {
      logger.error("Error en BuqueService.getBuqueById:", error);
      throw error;
    }
  }

  async getBuqueByNombre(nombre: string) {
    try {
      return await this.buqueRepository.findByNombre(nombre);
    } catch (error) {
      logger.error("Error en BuqueService.getBuqueByNombre:", error);
      throw error;
    }
  }

  async updateBuque(
    id: string,
    updateData: Partial<Buque>,
    updaterInfo: { id: string; email: string }
  ): Promise<BuqueActionResult> {
    try {
      const buqueExistente = await this.buqueRepository.findById(id);

      if (!buqueExistente) {
        return {
          success: false,
          error: "Buque no encontrado",
        };
      }

      // Si se está actualizando el nombre, verificar que no exista otro buque con ese nombre
      if (updateData.nombre && updateData.nombre !== buqueExistente.nombre) {
        const buqueConMismoNombre = await this.buqueRepository.findByNombre(
          updateData.nombre
        );
        if (buqueConMismoNombre && buqueConMismoNombre.id !== id) {
          return {
            success: false,
            error: "Ya existe otro buque con este nombre",
          };
        }
      }

      const buque = await this.buqueRepository.update(id, updateData);

      auditLogger.log({
        usuario_id: updaterInfo.id,
        accion: "actualizar_buque",
        tipo: "exito",
        entidad_afectada: "buques",
        mensaje: `Buque actualizado: ${buque.nombre}`,
        detalles: {
          buque_id: id,
          campos_modificados: Object.keys(updateData),
          nombre_anterior: buqueExistente.nombre,
          nombre_nuevo: updateData.nombre,
        },
      });

      return {
        success: true,
        buque,
      };
    } catch (error) {
      logger.error("Error en BuqueService.updateBuque:", error);
      return {
        success: false,
        error: "Error interno del servidor",
      };
    }
  }

  async deleteBuque(id: string, deleterInfo: { id: string; email: string }) {
    try {
      const buque = await this.buqueRepository.findById(id);

      if (!buque) {
        throw new Error("Buque no encontrado");
      }

      // Verificar que no tenga recaladas activas
      const tieneRecaladasActivas = buque.recaladas?.some((recalada) =>
        ["PROGRAMADA", "EN_PUERTO"].includes(recalada.estado)
      );

      if (tieneRecaladasActivas) {
        throw new Error("No se puede eliminar un buque con recaladas activas");
      }

      await this.buqueRepository.delete(id);

      auditLogger.log({
        usuario_id: deleterInfo.id,
        accion: "eliminar_buque",
        tipo: "exito",
        entidad_afectada: "buques",
        mensaje: `Buque eliminado: ${buque.nombre}`,
        detalles: {
          buque_id: id,
          nombre: buque.nombre,
          bandera: buque.bandera,
        },
      });

      logger.info(`🗑️ Buque eliminado: ${buque.nombre}`);
    } catch (error) {
      logger.error("Error en BuqueService.deleteBuque:", error);
      throw error;
    }
  }

  async getBuqueStats(id: string) {
    try {
      const buque = await this.buqueRepository.findById(id);

      if (!buque) {
        return null;
      }

      const stats = {
        totalRecaladas: buque.recaladas?.length || 0,
        recaladasProgramadas:
          buque.recaladas?.filter((r) => r.estado === "PROGRAMADA").length || 0,
        recaladasEnPuerto:
          buque.recaladas?.filter((r) => r.estado === "EN_PUERTO").length || 0,
        recaladasFinalizadas:
          buque.recaladas?.filter((r) => r.estado === "FINALIZADA").length || 0,
        ultimaRecalada: buque.recaladas?.[0] || null,
        proximaRecalada:
          buque.recaladas?.find(
            (r) => r.estado === "PROGRAMADA" && r.fechaLlegada > new Date()
          ) || null,
      };

      return {
        buque,
        stats,
      };
    } catch (error) {
      logger.error("Error en BuqueService.getBuqueStats:", error);
      throw error;
    }
  }
}
