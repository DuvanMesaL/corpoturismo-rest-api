import { Router } from "express";
import { UserController } from "../../application/controllers/UserController";
import { authenticateToken, requireRole } from "../middleware/auth.middleware";

const router = Router();
const userController = new UserController();

// Todas las rutas requieren autenticación
router.use(authenticateToken);

// Listar usuarios (todos los roles)
router.get("/", userController.getUsers.bind(userController));

// Ver usuario específico (todos los roles)
router.get("/:id", userController.getUserById.bind(userController));

// Crear/invitar usuario (solo admins)
router.post(
  "/",
  requireRole(["super_admin", "admin"]),
  userController.inviteUser.bind(userController)
);

// Actualizar usuario (solo admins)
router.patch(
  "/:id",
  requireRole(["super_admin", "admin"]),
  userController.updateUser.bind(userController)
);

// Eliminar usuario (solo super admin)
router.delete(
  "/:id",
  requireRole(["super_admin"]),
  userController.deleteUser.bind(userController)
);

// Reenviar invitación a usuario (solo admins)
router.post(
  "/:id/resend-invitation",
  requireRole(["super_admin", "admin"]),
  userController.resendInvitation.bind(userController)
);

export default router;
