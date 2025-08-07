import { Response } from 'express';
import { TurnoService } from '../services/TurnoService';
import { auditLogger } from '../../infrastructure/logging/winston-logger';
import { AuthRequest } from '../../infrastructure/middleware/auth.middleware';
import { validateCreateTurno, validateUsarTurno } from '../validators/turno.validators';
import { EstadoTurno } from '../../domain/entities/Turno';

export class TurnoController {
  private turnoService: TurnoService;

  constructor() {
    this.turnoService = new TurnoService();
  }

  async createTurno(req: AuthRequest, res: Response): Promise<void> {
    try {
      const validation = validateCreateTurno(req.body);
      if (!validation.success) {
        res.status(400).json({ 
          error: 'Datos inválidos',
          details: validation.errors 
        });
        return;
      }

      const turnoData = validation.data;
      const creatorInfo = {
        id: req.user!.id,
        email: req.user!.email
      };

      if (!turnoData) {
        res.status(400).json({ error: 'Datos de turno incompletos.' });
        return;
      }

      const result = await this.turnoService.createTurno(turnoData, creatorInfo);

      if (!result.success) {
        res.status(400).json({ error: result.error });
        return;
      }

      res.status(201).json({
        message: 'Turno creado exitosamente',
        turno: result.turno
      });
    } catch (error) {
      res.status(500).json({ 
        error: 'Error interno del servidor' 
      });
    }
  }

  async tomarTurno(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id: turnoId } = req.params;
      const guiaInfo = {
        id: req.user!.id,
        email: req.user!.email,
        nombre: `${req.user!.rol.nombre} - ${req.user!.email}`
      };

      const result = await this.turnoService.tomarTurno(turnoId, guiaInfo);

      if (!result.success) {
        res.status(400).json({ error: result.error });
        return;
      }

      res.json({
        message: 'Turno tomado exitosamente',
        turno: result.turno
      });
    } catch (error) {
      res.status(500).json({ 
        error: 'Error interno del servidor' 
      });
    }
  }

  async usarTurno(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id: turnoId } = req.params;
      const validation = validateUsarTurno(req.body);
      
      if (!validation.success || !validation.data) {
        res.status(400).json({ 
          error: 'Datos inválidos',
          details: validation.errors 
        });
        return;
      }

      const { observaciones } = validation.data;
      const usuarioInfo = {
        id: req.user!.id,
        email: req.user!.email,
        nombre: `${req.user!.rol.nombre} - ${req.user!.email}`
      };

      const result = await this.turnoService.usarTurno(turnoId, usuarioInfo, observaciones);

      if (!result.success) {
        res.status(400).json({ error: result.error });
        return;
      }

      res.json({
        message: 'Turno iniciado exitosamente',
        turno: result.turno
      });
    } catch (error) {
      res.status(500).json({ 
        error: 'Error interno del servidor' 
      });
    }
  }

  async liberarTurno(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id: turnoId } = req.params;
      const usuarioInfo = {
        id: req.user!.id,
        email: req.user!.email,
        nombre: `${req.user!.rol.nombre} - ${req.user!.email}`
      };

      const result = await this.turnoService.liberarTurno(turnoId, usuarioInfo);

      if (!result.success) {
        res.status(400).json({ error: result.error });
        return;
      }

      res.json({
        message: 'Turno liberado exitosamente',
        turno: result.turno
      });
    } catch (error) {
      res.status(500).json({ 
        error: 'Error interno del servidor' 
      });
    }
  }

  async terminarTurno(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id: turnoId } = req.params;
      const { horasTrabajadas } = req.body;
      
      const usuarioInfo = {
        id: req.user!.id,
        email: req.user!.email,
        nombre: `${req.user!.rol.nombre} - ${req.user!.email}`
      };

      const result = await this.turnoService.terminarTurno(turnoId, usuarioInfo, horasTrabajadas);

      if (!result.success) {
        res.status(400).json({ error: result.error });
        return;
      }

      res.json({
        message: 'Turno terminado exitosamente',
        turno: result.turno
      });
    } catch (error) {
      res.status(500).json({ 
        error: 'Error interno del servidor' 
      });
    }
  }

  async cancelarTurno(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id: turnoId } = req.params;
      const { motivo } = req.body;
      
      const usuarioInfo = {
        id: req.user!.id,
        email: req.user!.email,
        nombre: `${req.user!.rol.nombre} - ${req.user!.email}`
      };

      const result = await this.turnoService.cancelarTurno(turnoId, usuarioInfo, motivo);

      if (!result.success) {
        res.status(400).json({ error: result.error });
        return;
      }

      res.json({
        message: 'Turno cancelado exitosamente',
        turno: result.turno
      });
    } catch (error) {
      res.status(500).json({ 
        error: 'Error interno del servidor' 
      });
    }
  }

  async getTurnos(req: AuthRequest, res: Response): Promise<void> {
    try {
      const filters = {
        estado: req.query.estado as EstadoTurno | undefined,
        guiaId: req.query.guiaId as string | undefined,
        recaladaId: req.query.recaladaId as string | undefined,
        fechaInicio: req.query.fechaInicio ? new Date(req.query.fechaInicio as string) : undefined,
        fechaFin: req.query.fechaFin ? new Date(req.query.fechaFin as string) : undefined,
        page: req.query.page ? parseInt(req.query.page as string) : undefined,
        limit: req.query.limit ? parseInt(req.query.limit as string) : undefined
      };

      const turnos = await this.turnoService.getTurnos(filters);

      res.json({
        turnos,
        total: turnos.length,
        filters
      });
    } catch (error) {
      res.status(500).json({ 
        error: 'Error interno del servidor' 
      });
    }
  }

  async getTurnoById(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const turno = await this.turnoService.getTurnoById(id);

      if (!turno) {
        res.status(404).json({ error: 'Turno no encontrado' });
        return;
      }

      res.json({ turno });
    } catch (error) {
      res.status(500).json({ 
        error: 'Error interno del servidor' 
      });
    }
  }

  async getTurnosDisponibles(req: AuthRequest, res: Response): Promise<void> {
    try {
      const filters = {
        fechaInicio: req.query.fechaInicio ? new Date(req.query.fechaInicio as string) : undefined,
        fechaFin: req.query.fechaFin ? new Date(req.query.fechaFin as string) : undefined,
        recaladaId: req.query.recaladaId as string | undefined
      };

      const turnos = await this.turnoService.getTurnosDisponibles(filters);

      res.json({
        turnos,
        total: turnos.length,
        filters
      });
    } catch (error) {
      res.status(500).json({ 
        error: 'Error interno del servidor' 
      });
    }
  }

  async getMisTurnos(req: AuthRequest, res: Response): Promise<void> {
    try {
      const filters = {
        estado: req.query.estado as EstadoTurno | undefined,
        fechaInicio: req.query.fechaInicio ? new Date(req.query.fechaInicio as string) : undefined,
        fechaFin: req.query.fechaFin ? new Date(req.query.fechaFin as string) : undefined
      };

      const turnos = await this.turnoService.getTurnosByGuia(req.user!.id, filters);

      res.json({
        turnos,
        total: turnos.length,
        filters
      });
    } catch (error) {
      res.status(500).json({ 
        error: 'Error interno del servidor' 
      });
    }
  }
}
