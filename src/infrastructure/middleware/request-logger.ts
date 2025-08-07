import { Request, Response, NextFunction } from "express";
import { auditLogger } from "../logging/winston-logger";
import { AuthRequest } from "./auth.middleware";

export const requestLogger = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const startTime = Date.now();

  // Override res.json to capture response
  const originalJson = res.json;
  res.json = function (body: any) {
    const endTime = Date.now();
    const responseTime = endTime - startTime;

    // Solo loggear endpoints importantes (no health checks)
    if (!req.path.includes("/health")) {
      auditLogger.log({
        usuario_id: req.user?.id,
        accion: `${req.method.toLowerCase()}_${req.path.replace(/\//g, "_")}`,
        tipo: res.statusCode >= 400 ? "error" : "exito",
        entidad_afectada: extractEntityFromPath(req.path),
        mensaje: `${req.method} ${req.path} - ${res.statusCode}`,
        ip: req.ip,
        user_agent: req.get("User-Agent"),
        endpoint: req.path,
        metodo_http: req.method,
        status_code: res.statusCode,
        tiempo_respuesta_ms: responseTime,
        host_origen: req.get("Host"),
        detalles: {
          query: req.query,
          params: req.params,
          body_size: JSON.stringify(req.body || {}).length,
        },
      });
    }

    return originalJson.call(this, body);
  };

  next();
};

function extractEntityFromPath(path: string): string {
  const segments = path.split("/").filter(Boolean);
  if (segments.length >= 2 && segments[0] === "api") {
    return segments[1]; // usuarios, turnos, recaladas, etc.
  }
  return "unknown";
}
