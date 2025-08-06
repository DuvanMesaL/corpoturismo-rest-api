import { Router } from 'express';
import { TurnoController } from '../../application/controllers/TurnoController';
import { authenticateToken, requireRole } from '../middleware/auth.middleware';

const router = Router();
const turnoController = new TurnoController();

// Todas las rutas requieren autenticación
router.use(authenticateToken);

// Listar turnos (todos los roles)
router.get('/', turnoController.getTurnos.bind(turnoController));

// Ver turnos disponibles (guías y supervisores)
router.get('/disponibles', 
  requireRole(['guia', 'supervisor', 'admin', 'super_admin']),
  turnoController.getTurnosDisponibles.bind(turnoController)
);

// Ver mis turnos (guías y supervisores)
router.get('/mis-turnos', 
  requireRole(['guia', 'supervisor']),
  turnoController.getMisTurnos.bind(turnoController)
);

// Ver turno específico (todos los roles)
router.get('/:id', turnoController.getTurnoById.bind(turnoController));

// Crear turno (solo admins)
router.post('/', 
  requireRole(['admin', 'super_admin']), 
  turnoController.createTurno.bind(turnoController)
);

// Tomar turno (guías y supervisores)
router.post('/:id/tomar', 
  requireRole(['guia', 'supervisor']),
  turnoController.tomarTurno.bind(turnoController)
);

// Usar turno (guías y supervisores)
router.patch('/:id/usar', 
  requireRole(['guia', 'supervisor']),
  turnoController.usarTurno.bind(turnoController)
);

// Liberar turno (guías y supervisores)
router.patch('/:id/liberar', 
  requireRole(['guia', 'supervisor']),
  turnoController.liberarTurno.bind(turnoController)
);

// Terminar turno (guías y supervisores)
router.patch('/:id/terminar', 
  requireRole(['guia', 'supervisor']),
  turnoController.terminarTurno.bind(turnoController)
);

// Cancelar turno (guías, supervisores y admins)
router.patch('/:id/cancelar', 
  requireRole(['guia', 'supervisor', 'admin', 'super_admin']),
  turnoController.cancelarTurno.bind(turnoController)
);

export default router;
