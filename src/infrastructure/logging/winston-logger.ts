import winston from "winston";
import Transport from "winston-transport";
import { AuditLog } from "../database/mongodb";

// Custom transport para MongoDB
class MongoDBTransport extends Transport {
  constructor(opts: any) {
    super(opts);
  }

  log(info: any, callback: () => void) {
    setImmediate(() => {
      this.emit("logged", info);
    });

    // Solo guardar logs de auditoría en MongoDB
    if (info.isAuditLog) {
      const logData = {
        timestamp: new Date(),
        usuario_id: info.usuario_id,
        accion: info.accion,
        tipo: info.tipo || "exito",
        entidad_afectada: info.entidad_afectada,
        detalles: info.detalles,
        ip: info.ip,
        user_agent: info.user_agent,
        endpoint: info.endpoint,
        metodo_http: info.metodo_http,
        status_code: info.status_code,
        mensaje: info.message,
        tiempo_respuesta_ms: info.tiempo_respuesta_ms,
        host_origen: info.host_origen,
      };

      AuditLog.create(logData).catch((err) => {
        console.error("Error guardando log en MongoDB:", err);
      });
    }

    callback();
  }
}

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || "info",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      ),
    }),
    new winston.transports.File({
      filename: "logs/error.log",
      level: "error",
    }),
    new winston.transports.File({
      filename: "logs/combined.log",
    }),
    new MongoDBTransport({}),
  ],
});

// Función helper para logs de auditoría
export const auditLogger = {
  log: (data: {
    usuario_id?: string;
    accion: string;
    tipo?: "exito" | "error" | "advertencia";
    entidad_afectada?: string;
    detalles?: any;
    ip?: string;
    user_agent?: string;
    endpoint?: string;
    metodo_http?: string;
    status_code?: number;
    mensaje: string;
    tiempo_respuesta_ms?: number;
    host_origen?: string;
  }) => {
    logger.info(data.mensaje, {
      ...data,
      isAuditLog: true,
    });
  },
};
