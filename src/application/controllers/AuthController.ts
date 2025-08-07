import { Request, Response } from 'express';
import { AuthService } from '../services/AuthService';
import { auditLogger } from '../../infrastructure/logging/winston-logger';
import { AuthRequest } from '../../infrastructure/middleware/auth.middleware';
import { validateCompleteRegistration } from '../validators/user.validators';

export class AuthController {
  private authService: AuthService;

  constructor() {
    this.authService = new AuthService();
  }

  async login(req: Request, res: Response): Promise<void> {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        res.status(400).json({ 
          error: 'Email y contraseña son requeridos' 
        });
        return;
      }

      const result = await this.authService.login(email, password, {
        ip: req.ip,
        userAgent: req.get('User-Agent') || ''
      });

      if (!result.success) {
        auditLogger.log({
          accion: 'login_fallido',
          tipo: 'advertencia',
          mensaje: `Intento de login fallido para: ${email}`,
          ip: req.ip,
          user_agent: req.get('User-Agent'),
          endpoint: req.path,
          metodo_http: req.method,
          status_code: 401,
          detalles: { email, error: result.error }
        });

        res.status(401).json({ error: result.error });
        return;
      }

      auditLogger.log({
        usuario_id: result.user!.id,
        accion: 'login_exitoso',
        tipo: 'exito',
        mensaje: `Login exitoso para: ${email}`,
        ip: req.ip,
        user_agent: req.get('User-Agent'),
        endpoint: req.path,
        metodo_http: req.method,
        status_code: 200,
        detalles: { 
          email,
          rol: result.user!.rol.nombre
        }
      });

      res.json({
        message: 'Login exitoso',
        token: result.token,
        user: {
          id: result.user!.id,
          uuid: result.user!.uuid,
          email: result.user!.email,
          nombre: `${result.user!.primerNombre || ''} ${result.user!.primerApellido || ''}`.trim(),
          rol: result.user!.rol
        }
      });
    } catch (error) {
      auditLogger.log({
        accion: 'login_error',
        tipo: 'error',
        mensaje: `Error en login: ${(error as Error).message}`,
        ip: req.ip,
        user_agent: req.get('User-Agent'),
        endpoint: req.path,
        metodo_http: req.method,
        status_code: 500,
        detalles: { error: (error as Error).message }
      });

      res.status(500).json({ 
        error: 'Error interno del servidor' 
      });
    }
  }

  async completeRegistration(req: Request, res: Response): Promise<void> {
    try {
      // Validar datos de entrada
      const validation = validateCompleteRegistration(req.body);
      if (!validation.success) {
        res.status(400).json({ 
          error: 'Datos inválidos',
          details: validation.errors 
        });
        return;
      }

      const registrationData = validation.data;

      if (!registrationData) {
        res.status(400).json({ error: 'Datos de registro incompletos.' });
        return;
      }

      const result = await this.authService.completeRegistration(registrationData, {
        ip: req.ip,
        userAgent: req.get('User-Agent') || ''
      });


      if (!result.success) {
        res.status(400).json({ error: result.error });
        return;
      }

      auditLogger.log({
        usuario_id: result.user!.id,
        accion: 'registro_completado',
        tipo: 'exito',
        entidad_afectada: 'usuarios',
        mensaje: `Registro completado para: ${result.user!.email}`,
        ip: req.ip,
        user_agent: req.get('User-Agent'),
        endpoint: req.path,
        metodo_http: req.method,
        status_code: 200,
        detalles: {
          email: result.user!.email,
          rol: result.user!.rol.nombre
        }
      });

      res.json({
        message: 'Registro completado exitosamente',
        token: result.token,
        user: {
          id: result.user!.id,
          uuid: result.user!.uuid,
          email: result.user!.email,
          nombre: `${result.user!.primerNombre} ${result.user!.primerApellido}`,
          rol: result.user!.rol
        }
      });
    } catch (error) {
      res.status(500).json({ 
        error: 'Error interno del servidor' 
      });
    }
  }

  async getCurrentUser(req: AuthRequest, res: Response): Promise<void> {
    try {
      const user = await this.authService.getCurrentUser(req.user!.id);
      
      if (!user) {
        res.status(404).json({ error: 'Usuario no encontrado' });
        return;
      }

      res.json({
        user: {
          id: user.id,
          uuid: user.uuid,
          email: user.email,
          nombre: `${user.primerNombre || ''} ${user.primerApellido || ''}`.trim(),
          rol: user.rol
        }
      });
    } catch (error) {
      res.status(500).json({ 
        error: 'Error interno del servidor' 
      });
    }
  }

  async refreshToken(req: AuthRequest, res: Response): Promise<void> {
    try {
      const newToken = await this.authService.refreshToken(req.user!.id);
      
      res.json({
        message: 'Token renovado',
        token: newToken
      });
    } catch (error) {
      res.status(500).json({ 
        error: 'Error interno del servidor' 
      });
    }
  }

  async logout(req: AuthRequest, res: Response): Promise<void> {
    try {
      auditLogger.log({
        usuario_id: req.user!.id,
        accion: 'logout',
        tipo: 'exito',
        mensaje: `Logout exitoso para: ${req.user!.email}`,
        ip: req.ip,
        user_agent: req.get('User-Agent'),
        endpoint: req.path,
        metodo_http: req.method,
        status_code: 200
      });

      res.json({ message: 'Logout exitoso' });
    } catch (error) {
      res.status(500).json({ 
        error: 'Error interno del servidor' 
      });
    }
  }
}
