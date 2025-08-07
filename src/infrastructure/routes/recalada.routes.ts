import { Router } from 'express';
import { RecaladaController } from '../../application/controllers/RecaladaController';
import { authenticateToken, requireRole } from '../middleware/auth.middleware';

const router = Router();
const recaladaController = new RecaladaController();

// Todas las rutas requieren autenticación
router.use(authenticateToken);

// Listar recaladas (todos los roles)
router.get('/', recaladaController.getRecaladas.bind(recaladaController));

// Ver recaladas activas (todos los roles) - ENDPOINT CRÍTICO
router.get('/activas', recaladaController.getRecaladasActivas.bind(recaladaController));

// Ver recalada específica (todos los roles)
router.get('/:id', recaladaController.getRecaladaById.bind(recaladaController));

// Ver atenciones por recalada (todos los roles) - ENDPOINT CRÍTICO
router.get('/:id/atenciones', recaladaController.getAtencionesByRecalada.bind(recaladaController));

// Crear recalada (solo admins)
router.post('/', 
  requireRole(['admin', 'super_admin']), 
  recaladaController.createRecalada.bind(recaladaController)
);

// Actualizar recalada (solo admins)
router.patch('/:id', 
  requireRole(['admin', 'super_admin']), 
  recaladaController.updateRecalada.bind(recaladaController)
);

// Cambiar estado de recalada (supervisores y admins)
router.patch('/:id/estado', 
  requireRole(['supervisor', 'admin', 'super_admin']), 
  recaladaController.cambiarEstadoRecalada.bind(recaladaController)
);

// Eliminar recalada (solo super admin)
router.delete('/:id', 
  requireRole(['super_admin']), 
  recaladaController.deleteRecalada.bind(recaladaController)
);

export default router;
