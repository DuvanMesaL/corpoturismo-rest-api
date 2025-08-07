import { Request, Response, NextFunction } from "express";
import { logger, auditLogger } from "../logging/winston-logger";
import { AuthRequest } from "./auth.middleware";

export const errorHandler = (
  error: Error,
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  logger.error("Error no manejado:", {
    error: error.message,
    stack: error.stack,
    path: req.path,
    method: req.method,
    user: req.user?.id,
  });

  auditLogger.log({
    usuario_id: req.user?.id,
    accion: "error_servidor",
    tipo: "error",
    entidad_afectada: extractEntityFromPath(req.path),
    mensaje: `Error interno del servidor: ${error.message}`,
    ip: req.ip,
    user_agent: req.get("User-Agent"),
    endpoint: req.path,
    metodo_http: req.method,
    status_code: 500,
    detalles: {
      error_message: error.message,
      stack: error.stack,
    },
  });

  res.status(500).json({
    error: "Error interno del servidor",
    message:
      process.env.NODE_ENV === "development" ? error.message : "Algo salió mal",
  });
};

function extractEntityFromPath(path: string): string {
  const segments = path.split("/").filter(Boolean);
  if (segments.length >= 2 && segments[0] === "api") {
    return segments[1];
  }
  return "unknown";
}
