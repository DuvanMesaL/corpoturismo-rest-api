import { AuditLog } from "../../infrastructure/database/mongodb";
import { logger } from "../../infrastructure/logging/winston-logger";

export interface AuditFilters {
  fechaInicio?: Date;
  fechaFin?: Date;
  usuarioId?: string;
  accion?: string;
  entidadAfectada?: string;
  tipo?: "exito" | "error" | "advertencia";
  ip?: string;
  endpoint?: string;
  metodoHttp?: string;
  page?: number;
  limit?: number;
}

export interface AuditStats {
  totalLogs: number;
  logsPorTipo: {
    exito: number;
    error: number;
    advertencia: number;
  };
  accionesMasComunes: Array<{
    accion: string;
    count: number;
  }>;
  usuariosMasActivos: Array<{
    usuario_id: string;
    count: number;
  }>;
  entidadesMasAfectadas: Array<{
    entidad: string;
    count: number;
  }>;
}

export class AuditService {
  async getLogs(filters: AuditFilters) {
    try {
      const query: any = {};

      // Filtros de fecha
      if (filters.fechaInicio || filters.fechaFin) {
        query.timestamp = {};
        if (filters.fechaInicio) {
          query.timestamp.$gte = filters.fechaInicio;
        }
        if (filters.fechaFin) {
          query.timestamp.$lte = filters.fechaFin;
        }
      }

      // Otros filtros
      if (filters.usuarioId) {
        query.usuario_id = filters.usuarioId;
      }

      if (filters.accion) {
        query.accion = { $regex: filters.accion, $options: "i" };
      }

      if (filters.entidadAfectada) {
        query.entidad_afectada = filters.entidadAfectada;
      }

      if (filters.tipo) {
        query.tipo = filters.tipo;
      }

      if (filters.ip) {
        query.ip = filters.ip;
      }

      if (filters.endpoint) {
        query.endpoint = { $regex: filters.endpoint, $options: "i" };
      }

      if (filters.metodoHttp) {
        query.metodo_http = filters.metodoHttp;
      }

      const page = filters.page || 1;
      const limit = filters.limit || 50;
      const skip = (page - 1) * limit;

      const logs = await AuditLog.find(query)
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(limit)
        .lean();

      const total = await AuditLog.countDocuments(query);

      return {
        logs,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        filters,
      };
    } catch (error) {
      logger.error("Error en AuditService.getLogs:", error);
      throw error;
    }
  }

  async getStats(filters?: {
    fechaInicio?: Date;
    fechaFin?: Date;
  }): Promise<AuditStats> {
    try {
      const matchStage: any = {};

      if (filters?.fechaInicio || filters?.fechaFin) {
        matchStage.timestamp = {};
        if (filters.fechaInicio) {
          matchStage.timestamp.$gte = filters.fechaInicio;
        }
        if (filters.fechaFin) {
          matchStage.timestamp.$lte = filters.fechaFin;
        }
      }

      const pipeline: any[] = [
        { $match: matchStage },
        {
          $facet: {
            totalLogs: [{ $count: "count" }],
            logsPorTipo: [{ $group: { _id: "$tipo", count: { $sum: 1 } } }],
            accionesMasComunes: [
              { $group: { _id: "$accion", count: { $sum: 1 } } },
              { $sort: { count: -1 } },
              { $limit: 10 },
            ],
            usuariosMasActivos: [
              { $match: { usuario_id: { $exists: true, $ne: null } } },
              { $group: { _id: "$usuario_id", count: { $sum: 1 } } },
              { $sort: { count: -1 } },
              { $limit: 10 },
            ],
            entidadesMasAfectadas: [
              { $match: { entidad_afectada: { $exists: true, $ne: null } } },
              { $group: { _id: "$entidad_afectada", count: { $sum: 1 } } },
              { $sort: { count: -1 } },
              { $limit: 10 },
            ],
          },
        },
      ];

      const [result] = await AuditLog.aggregate(pipeline);

      const stats: AuditStats = {
        totalLogs: result.totalLogs[0]?.count || 0,
        logsPorTipo: {
          exito: 0,
          error: 0,
          advertencia: 0,
        },
        accionesMasComunes: result.accionesMasComunes.map((item: any) => ({
          accion: item._id,
          count: item.count,
        })),
        usuariosMasActivos: result.usuariosMasActivos.map((item: any) => ({
          usuario_id: item._id,
          count: item.count,
        })),
        entidadesMasAfectadas: result.entidadesMasAfectadas.map(
          (item: any) => ({
            entidad: item._id,
            count: item.count,
          })
        ),
      };

      // Procesar logs por tipo
      result.logsPorTipo.forEach((item: any) => {
        if (item._id in stats.logsPorTipo) {
          stats.logsPorTipo[item._id as keyof typeof stats.logsPorTipo] =
            item.count;
        }
      });

      return stats;
    } catch (error) {
      logger.error("Error en AuditService.getStats:", error);
      throw error;
    }
  }

  async getLogsByUser(
    userId: string,
    filters?: {
      fechaInicio?: Date;
      fechaFin?: Date;
      accion?: string;
      page?: number;
      limit?: number;
    }
  ) {
    try {
      return await this.getLogs({
        ...filters,
        usuarioId: userId,
      });
    } catch (error) {
      logger.error("Error en AuditService.getLogsByUser:", error);
      throw error;
    }
  }

  async getLogsByEntity(
    entidad: string,
    filters?: {
      fechaInicio?: Date;
      fechaFin?: Date;
      accion?: string;
      page?: number;
      limit?: number;
    }
  ) {
    try {
      return await this.getLogs({
        ...filters,
        entidadAfectada: entidad,
      });
    } catch (error) {
      logger.error("Error en AuditService.getLogsByEntity:", error);
      throw error;
    }
  }

  async exportLogs(filters: AuditFilters, format: "json" | "csv" = "json") {
    try {
      const result = await this.getLogs({
        ...filters,
        limit: 10000, // Límite alto para exportación
      });

      if (format === "csv") {
        return this.convertToCSV(result.logs);
      }

      return result.logs;
    } catch (error) {
      logger.error("Error en AuditService.exportLogs:", error);
      throw error;
    }
  }

  private convertToCSV(logs: any[]): string {
    if (logs.length === 0) return "";

    const headers = [
      "timestamp",
      "usuario_id",
      "accion",
      "tipo",
      "entidad_afectada",
      "mensaje",
      "ip",
      "endpoint",
      "metodo_http",
      "status_code",
    ];

    const csvRows = [
      headers.join(","),
      ...logs.map((log) =>
        headers
          .map((header) => {
            const value = log[header] || "";
            return `"${String(value).replace(/"/g, '""')}"`;
          })
          .join(",")
      ),
    ];

    return csvRows.join("\n");
  }
}
