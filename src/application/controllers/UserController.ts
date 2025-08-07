import { Response } from 'express';
import { UserService } from '../services/UserService';
import { auditLogger } from '../../infrastructure/logging/winston-logger';
import { AuthRequest } from '../../infrastructure/middleware/auth.middleware';
import { validateCreateUser, validateUpdateUser } from '../validators/user.validators';

export class UserController {
  private userService: UserService;

  constructor() {
    this.userService = new UserService();
  }

  async inviteUser(req: AuthRequest, res: Response): Promise<void> {
    try {
      // Validar datos de entrada
      const validation = validateCreateUser(req.body);
      if (!validation.success || !validation.data) {
        res.status(400).json({ 
          error: 'Datos inválidos',
          details: validation.errors 
        });
        return;
      }

      const userData = validation.data;
      const inviterInfo = {
        id: req.user!.id,
        email: req.user!.email,
        nombre: `${req.user!.rol.nombre} - ${req.user!.email}`
      };

      const result = await this.userService.inviteUser(userData, inviterInfo);

      if (!result.success) {
        res.status(400).json({ error: result.error });
        return;
      }

      res.status(201).json({
        message: 'Usuario invitado exitosamente',
        user: {
          id: result.user!.id,
          uuid: result.user!.uuid,
          email: result.user!.email,
          estado: result.user!.estado,
          fechaInvitacion: result.user!.fechaInvitacion
        }
      });
    } catch (error) {
      auditLogger.log({
        usuario_id: req.user?.id,
        accion: 'invitar_usuario_error',
        tipo: 'error',
        entidad_afectada: 'usuarios',
        mensaje: `Error invitando usuario: ${(error as Error).message}`,
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

  async getUsers(req: AuthRequest, res: Response): Promise<void> {
    try {
      const filters = {
        estado: req.query.estado as 'activo' | 'inactivo' | undefined,
        rolId: req.query.rolId as string | undefined,
        search: req.query.search as string | undefined,
        page: req.query.page ? parseInt(req.query.page as string) : undefined,
        limit: req.query.limit ? parseInt(req.query.limit as string) : undefined
      };

      const users = await this.userService.getUsers(filters);

      // Filtrar información sensible
      const safeUsers = users.map(user => ({
        id: user.id,
        uuid: user.uuid,
        email: user.email,
        primerNombre: user.primerNombre,
        segundoNombre: user.segundoNombre,
        primerApellido: user.primerApellido,
        segundoApellido: user.segundoApellido,
        telefono: user.telefono,
        estado: user.estado,
        fechaInvitacion: user.fechaInvitacion,
        fechaActivacion: user.fechaActivacion,
        esTemporal: user.esTemporal,
        rol: user.rol,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      }));

      res.json({
        users: safeUsers,
        total: safeUsers.length,
        filters
      });
    } catch (error) {
      res.status(500).json({ 
        error: 'Error interno del servidor' 
      });
    }
  }

  async getUserById(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const user = await this.userService.getUserById(id);

      if (!user) {
        res.status(404).json({ error: 'Usuario no encontrado' });
        return;
      }

      // Filtrar información sensible
      const safeUser = {
        id: user.id,
        uuid: user.uuid,
        email: user.email,
        primerNombre: user.primerNombre,
        segundoNombre: user.segundoNombre,
        primerApellido: user.primerApellido,
        segundoApellido: user.segundoApellido,
        telefono: user.telefono,
        estado: user.estado,
        fechaInvitacion: user.fechaInvitacion,
        fechaActivacion: user.fechaActivacion,
        esTemporal: user.esTemporal,
        rol: user.rol,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      };

      res.json({ user: safeUser });
    } catch (error) {
      res.status(500).json({ 
        error: 'Error interno del servidor' 
      });
    }
  }

  async updateUser(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      
      // Validar datos de entrada
      const validation = validateUpdateUser(req.body);
      if (!validation.success || !validation.data) {
        res.status(400).json({ 
          error: 'Datos inválidos',
          details: validation.errors 
        });
        return;
      }

      const updateData = validation.data;
      const updaterInfo = {
        id: req.user!.id,
        email: req.user!.email
      };

      const updatedUser = await this.userService.updateUser(id, updateData, updaterInfo);

      res.json({
        message: 'Usuario actualizado exitosamente',
        user: {
          id: updatedUser.id,
          email: updatedUser.email,
          primerNombre: updatedUser.primerNombre,
          primerApellido: updatedUser.primerApellido,
          estado: updatedUser.estado,
          updatedAt: updatedUser.updatedAt
        }
      });
    } catch (error) {
      if ((error as Error).message === 'Usuario no encontrado') {
        res.status(404).json({ error: 'Usuario no encontrado' });
        return;
      }

      res.status(500).json({ 
        error: 'Error interno del servidor' 
      });
    }
  }

  async deleteUser(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const deleterInfo = {
        id: req.user!.id,
        email: req.user!.email
      };

      await this.userService.deleteUser(id, deleterInfo);

      res.json({ message: 'Usuario eliminado exitosamente' });
    } catch (error) {
      if ((error as Error).message === 'Usuario no encontrado') {
        res.status(404).json({ error: 'Usuario no encontrado' });
        return;
      }

      if ((error as Error).message.includes('Super Administrador')) {
        res.status(403).json({ error: (error as Error).message });
        return;
      }

      res.status(500).json({ 
        error: 'Error interno del servidor' 
      });
    }
  }

  async resendInvitation(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const resenderInfo = {
        id: req.user!.id,
        email: req.user!.email,
        nombre: `${req.user!.rol.nombre} - ${req.user!.email}`
      };

      const result = await this.userService.resendInvitation(id, resenderInfo);

      if (!result.success) {
        res.status(400).json({ error: result.error });
        return;
      }

      res.json({ message: 'Invitación reenviada exitosamente' });
    } catch (error) {
      res.status(500).json({ 
        error: 'Error interno del servidor' 
      });
    }
  }
}
