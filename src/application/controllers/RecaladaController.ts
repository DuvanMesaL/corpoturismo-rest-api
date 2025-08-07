import { Response } from 'express';
import { RecaladaService } from '../services/RecaladaService';
import { auditLogger } from '../../infrastructure/logging/winston-logger';
import { AuthRequest } from '../../infrastructure/middleware/auth.middleware';
import { validateCreateRecalada, validateUpdateRecalada } from '../validators/recalada.validators';
import { Recalada, EstadoRecalada } from '../../domain/entities/Recalada';

export class RecaladaController {
  private recaladaService: RecaladaService;

  constructor() {
    this.recaladaService = new RecaladaService();
  }

  async createRecalada(req: AuthRequest, res: Response): Promise<void> {
    try {
      const validation = validateCreateRecalada(req.body);
      if (!validation.success) {
        res.status(400).json({ 
          error: 'Datos inválidos',
          details: validation.errors 
        });
        return;
      }

      const recaladaData = validation.data;
      const creatorInfo = {
        id: req.user!.id,
        email: req.user!.email
      };

      if (!recaladaData) {
        res.status(400).json({ error: 'Datos de recalada incompletos.' });
        return;
      }

      const result = await this.recaladaService.createRecalada(recaladaData, creatorInfo);

      if (!result.success) {
        res.status(400).json({ error: result.error });
        return;
      }

      res.status(201).json({
        message: 'Recalada creada exitosamente',
        recalada: result.recalada
      });
    } catch (error) {
      res.status(500).json({ 
        error: 'Error interno del servidor' 
      });
    }
  }

  async getRecaladas(req: AuthRequest, res: Response): Promise<void> {
    try {
      const filters = {
        estado: req.query.estado as EstadoRecalada | undefined,
        buqueId: req.query.buqueId as string | undefined,
        fechaInicio: req.query.fechaInicio ? new Date(req.query.fechaInicio as string) : undefined,
        fechaFin: req.query.fechaFin ? new Date(req.query.fechaFin as string) : undefined,
        puertoOrigenId: req.query.puertoOrigenId as string | undefined,
        puertoDestinoId: req.query.puertoDestinoId as string | undefined,
        page: req.query.page ? parseInt(req.query.page as string) : undefined,
        limit: req.query.limit ? parseInt(req.query.limit as string) : undefined
      };

      const recaladas = await this.recaladaService.getRecaladas(filters);

      res.json({
        recaladas,
        total: recaladas.length,
        filters
      });
    } catch (error) {
      res.status(500).json({ 
        error: 'Error interno del servidor' 
      });
    }
  }

  async getRecaladasActivas(req: AuthRequest, res: Response): Promise<void> {
    try {
      const fecha = req.query.fecha ? new Date(req.query.fecha as string) : new Date();
      const recaladas = await this.recaladaService.getRecaladasActivas(fecha);

      res.json({
        recaladas,
        fecha: fecha.toISOString(),
        total: recaladas.length
      });
    } catch (error) {
      res.status(500).json({ 
        error: 'Error interno del servidor' 
      });
    }
  }

  async getRecaladaById(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const recalada = await this.recaladaService.getRecaladaById(id);

      if (!recalada) {
        res.status(404).json({ error: 'Recalada no encontrada' });
        return;
      }

      res.json({ recalada });
    } catch (error) {
      res.status(500).json({ 
        error: 'Error interno del servidor' 
      });
    }
  }

  async getAtencionesByRecalada(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const recalada = await this.recaladaService.getRecaladaById(id);

      if (!recalada) {
        res.status(404).json({ error: 'Recalada no encontrada' });
        return;
      }

      res.json({
        recalada: {
          id: recalada.id,
          buque: recalada.buque,
          fechaLlegada: recalada.fechaLlegada,
          fechaSalida: recalada.fechaSalida,
          estado: recalada.estado
        },
        atenciones: recalada.atenciones || [],
        total: recalada.atenciones?.length || 0
      });
    } catch (error) {
      res.status(500).json({ 
        error: 'Error interno del servidor' 
      });
    }
  }

  async updateRecalada(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const validation = validateUpdateRecalada(req.body);
      if (!validation.success) {
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

      if (!updateData) {
        res.status(400).json({ error: 'Datos para actualizar recalada incompletos.' });
        return;
      }

      if (updateData.estado && typeof updateData.estado === "string") {
        if (Object.values(EstadoRecalada).includes(updateData.estado as EstadoRecalada)) {
          updateData.estado = updateData.estado as EstadoRecalada;
        }
      }

      const result = await this.recaladaService.updateRecalada(
        id, 
        updateData as Partial<Omit<Recalada, 'estado'>> & { estado?: EstadoRecalada }, 
        updaterInfo
      );

      if (!result.success) {
        res.status(400).json({ error: result.error });
        return;
      }

      res.json({
        message: 'Recalada actualizada exitosamente',
        recalada: result.recalada
      });
    } catch (error) {
      res.status(500).json({ 
        error: 'Error interno del servidor' 
      });
    }
  }

  async cambiarEstadoRecalada(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { estado } = req.body;

      if (!estado || !Object.values(EstadoRecalada).includes(estado)) {
        res.status(400).json({ 
          error: 'Estado inválido',
          estadosValidos: Object.values(EstadoRecalada)
        });
        return;
      }

      const usuarioInfo = {
        id: req.user!.id,
        email: req.user!.email,
        nombre: `${req.user!.rol.nombre} - ${req.user!.email}`
      };

      const result = await this.recaladaService.cambiarEstadoRecalada(id, estado, usuarioInfo);

      if (!result.success) {
        res.status(400).json({ error: result.error });
        return;
      }

      res.json({
        message: 'Estado de recalada actualizado exitosamente',
        recalada: result.recalada
      });
    } catch (error) {
      res.status(500).json({ 
        error: 'Error interno del servidor' 
      });
    }
  }

  async deleteRecalada(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const deleterInfo = {
        id: req.user!.id,
        email: req.user!.email
      };

      await this.recaladaService.deleteRecalada(id, deleterInfo);

      res.json({ message: 'Recalada eliminada exitosamente' });
    } catch (error) {
      if ((error as Error).message === 'Recalada no encontrada') {
        res.status(404).json({ error: 'Recalada no encontrada' });
        return;
      }

      if ((error as Error).message.includes('turnos activos')) {
        res.status(400).json({ error: (error as Error).message });
        return;
      }

      res.status(500).json({ 
        error: 'Error interno del servidor' 
      });
    }
  }
}
