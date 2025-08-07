import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { PrismaClient } from "@prisma/client";
import { auditLogger } from "../logging/winston-logger";

const prisma = new PrismaClient();

export interface AuthRequest extends Request {
  user?: {
    id: string;
    uuid: string;
    email: string;
    rol: {
      id: string;
      nombre: string;
      permisos: string[];
    };
  };
}

export const authenticateToken = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    auditLogger.log({
      accion: "acceso_denegado",
      tipo: "advertencia",
      mensaje: "Token no proporcionado",
      ip: req.ip,
      user_agent: req.get("User-Agent"),
      endpoint: req.path,
      metodo_http: req.method,
      status_code: 401,
    });

    return res.status(401).json({
      error: "Token de acceso requerido",
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: {
        rol: true,
      },
    });

    if (!user || user.estado !== "ACTIVO") {
      auditLogger.log({
        usuario_id: decoded.userId,
        accion: "acceso_denegado",
        tipo: "advertencia",
        mensaje: "Usuario inactivo o no encontrado",
        ip: req.ip,
        user_agent: req.get("User-Agent"),
        endpoint: req.path,
        metodo_http: req.method,
        status_code: 401,
      });

      return res.status(401).json({
        error: "Usuario no autorizado",
      });
    }

    req.user = {
      id: user.id,
      uuid: user.uuid,
      email: user.email,
      rol: {
        id: user.rol.id,
        nombre: user.rol.nombre,
        permisos: user.rol.permisos,
      },
    };

    next();
  } catch (error) {
    auditLogger.log({
      accion: "token_invalido",
      tipo: "error",
      mensaje: "Token JWT inválido",
      ip: req.ip,
      user_agent: req.get("User-Agent"),
      endpoint: req.path,
      metodo_http: req.method,
      status_code: 403,
      detalles: { error: (error as Error).message },
    });

    return res.status(403).json({
      error: "Token inválido",
    });
  }
};

export const requireRole = (roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        error: "Usuario no autenticado",
      });
    }

    const hasRole = roles.includes(req.user.rol.nombre);

    if (!hasRole) {
      auditLogger.log({
        usuario_id: req.user.id,
        accion: "acceso_denegado_rol",
        tipo: "advertencia",
        mensaje: `Acceso denegado. Rol requerido: ${roles.join(", ")}`,
        ip: req.ip,
        user_agent: req.get("User-Agent"),
        endpoint: req.path,
        metodo_http: req.method,
        status_code: 403,
        detalles: {
          rol_usuario: req.user.rol.nombre,
          roles_requeridos: roles,
        },
      });

      return res.status(403).json({
        error: "Permisos insuficientes",
        rolRequerido: roles,
        rolActual: req.user.rol.nombre,
      });
    }

    next();
  };
};
