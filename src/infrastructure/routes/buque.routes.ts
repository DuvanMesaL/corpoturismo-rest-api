import { Router } from "express";
import { BuqueController } from "../../application/controllers/BuqueController";
import { authenticateToken, requireRole } from "../middleware/auth.middleware";

const router = Router();
const buqueController = new BuqueController();

// Todas las rutas requieren autenticación
router.use(authenticateToken);

// Listar buques (todos los roles)
router.get("/", buqueController.getBuques.bind(buqueController));

// Ver buque específico (todos los roles) - ENDPOINT CRÍTICO
router.get("/:id", buqueController.getBuqueById.bind(buqueController));

// Ver estadísticas del buque (todos los roles)
router.get("/:id/stats", buqueController.getBuqueStats.bind(buqueController));

// Crear buque (solo admins)
router.post(
  "/",
  requireRole(["admin", "super_admin"]),
  buqueController.createBuque.bind(buqueController)
);

// Actualizar buque (solo admins)
router.patch(
  "/:id",
  requireRole(["admin", "super_admin"]),
  buqueController.updateBuque.bind(buqueController)
);

// Eliminar buque (solo super admin)
router.delete(
  "/:id",
  requireRole(["super_admin"]),
  buqueController.deleteBuque.bind(buqueController)
);

export default router;
