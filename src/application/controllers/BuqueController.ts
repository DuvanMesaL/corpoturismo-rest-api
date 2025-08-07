import { Response } from 'express';
import { BuqueService } from '../services/BuqueService';
import { auditLogger } from '../../infrastructure/logging/winston-logger';
import { AuthRequest } from '../../infrastructure/middleware/auth.middleware';
import { validateCreateBuque, validateUpdateBuque } from '../validators/buque.validators';

export class BuqueController {
  private buqueService: BuqueService;

  constructor() {
    this.buqueService = new BuqueService();
  }

  async createBuque(req: AuthRequest, res: Response): Promise<void> {
    try {
      const validation = validateCreateBuque(req.body);
      if (!validation.success) {
        res.status(400).json({ 
          error: 'Datos inválidos',
          details: validation.errors 
        });
        return;
      }

      const buqueData = validation.data;
      const creatorInfo = {
        id: req.user!.id,
        email: req.user!.email
      };

      if (!buqueData) {
        res.status(400).json({ error: 'Datos de buque incompletos o inválidos.' });
        return;
      }

      const result = await this.buqueService.createBuque(buqueData, creatorInfo);

      if (!result.success) {
        res.status(400).json({ error: result.error });
        return;
      }

      res.status(201).json({
        message: 'Buque creado exitosamente',
        buque: result.buque
      });
    } catch (error) {
      res.status(500).json({ 
        error: 'Error interno del servidor' 
      });
    }
  }

  async getBuques(req: AuthRequest, res: Response): Promise<void> {
    try {
      const filters = {
        nombre: req.query.nombre as string | undefined,
        bandera: req.query.bandera as string | undefined,
        tipoEmbarcacion: req.query.tipoEmbarcacion as string | undefined,
        page: req.query.page ? parseInt(req.query.page as string) : undefined,
        limit: req.query.limit ? parseInt(req.query.limit as string) : undefined
      };

      const buques = await this.buqueService.getBuques(filters);

      res.json({
        buques,
        total: buques.length,
        filters
      });
    } catch (error) {
      res.status(500).json({ 
        error: 'Error interno del servidor' 
      });
    }
  }

  async getBuqueById(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const buque = await this.buqueService.getBuqueById(id);

      if (!buque) {
        res.status(404).json({ error: 'Buque no encontrado' });
        return;
      }

      res.json({ buque });
    } catch (error) {
      res.status(500).json({ 
        error: 'Error interno del servidor' 
      });
    }
  }

  async getBuqueStats(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const result = await this.buqueService.getBuqueStats(id);

      if (!result) {
        res.status(404).json({ error: 'Buque no encontrado' });
        return;
      }

      res.json(result);
    } catch (error) {
      res.status(500).json({ 
        error: 'Error interno del servidor' 
      });
    }
  }

  async updateBuque(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      
      const validation = validateUpdateBuque(req.body);
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
        res.status(400).json({ error: 'Datos de actualización incompletos o inválidos.' });
        return;
      }

      const result = await this.buqueService.updateBuque(id, updateData, updaterInfo);

      if (!result.success) {
        res.status(400).json({ error: result.error });
        return;
      }

      res.json({
        message: 'Buque actualizado exitosamente',
        buque: result.buque
      });
    } catch (error) {
      res.status(500).json({ 
        error: 'Error interno del servidor' 
      });
    }
  }

  async deleteBuque(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const deleterInfo = {
        id: req.user!.id,
        email: req.user!.email
      };

      await this.buqueService.deleteBuque(id, deleterInfo);

      res.json({ message: 'Buque eliminado exitosamente' });
    } catch (error) {
      if ((error as Error).message === 'Buque no encontrado') {
        res.status(404).json({ error: 'Buque no encontrado' });
        return;
      }

      if ((error as Error).message.includes('recaladas activas')) {
        res.status(400).json({ error: (error as Error).message });
        return;
      }

      res.status(500).json({ 
        error: 'Error interno del servidor' 
      });
    }
  }
}
