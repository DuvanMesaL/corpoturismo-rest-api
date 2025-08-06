import { Router } from 'express';
import { AuthController } from '../../application/controllers/AuthController';
import { authenticateToken } from '../middleware/auth.middleware';

const router = Router();
const authController = new AuthController();

// Rutas públicas
router.post('/login', authController.login.bind(authController));
router.post('/complete-registration', authController.completeRegistration.bind(authController));

// Rutas protegidas
router.get('/me', authenticateToken, authController.getCurrentUser.bind(authController));
router.post('/refresh', authenticateToken, authController.refreshToken.bind(authController));
router.post('/logout', authenticateToken, authController.logout.bind(authController));

export default router;
