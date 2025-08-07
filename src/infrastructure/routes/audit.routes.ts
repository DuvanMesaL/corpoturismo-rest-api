import { Router } from "express";
import { AuditController } from "../../application/controllers/AuditController";
import { authenticateToken, requireRole } from "../middleware/auth.middleware";

const router = Router();
const auditController = new AuditController();

// Todas las rutas requieren autenticación y rol de admin
router.use(authenticateToken);
router.use(requireRole(["admin", "super_admin"]));

// Dashboard de auditoría - obtener logs con filtros
router.get("/logs", auditController.getLogs.bind(auditController));

// Estadísticas de auditoría
router.get("/stats", auditController.getStats.bind(auditController));

// Logs por usuario específico
router.get(
  "/users/:userId/logs",
  auditController.getLogsByUser.bind(auditController)
);

// Exportar logs (JSON o CSV)
router.get("/export", auditController.exportLogs.bind(auditController));

export default router;
