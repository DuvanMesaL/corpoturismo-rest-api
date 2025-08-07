import { Response } from 'express';
import { AuditService } from '../services/AuditService';
import { AuthRequest } from '../../infrastructure/middleware/auth.middleware';

export class AuditController {
  private auditService: AuditService;

  constructor() {
    this.auditService = new AuditService();
  }

  async getLogs(req: AuthRequest, res: Response): Promise<void> {
    try {
      const filters = {
        fechaInicio: req.query.fechaInicio ? new Date(req.query.fechaInicio as string) : undefined,
        fechaFin: req.query.fechaFin ? new Date(req.query.fechaFin as string) : undefined,
        usuarioId: req.query.usuarioId as string | undefined,
        accion: req.query.accion as string | undefined,
        entidadAfectada: req.query.entidadAfectada as string | undefined,
        tipo: req.query.tipo as 'exito' | 'error' | 'advertencia' | undefined,
        ip: req.query.ip as string | undefined,
        endpoint: req.query.endpoint as string | undefined,
        metodoHttp: req.query.metodoHttp as string | undefined,
        page: req.query.page ? parseInt(req.query.page as string) : undefined,
        limit: req.query.limit ? parseInt(req.query.limit as string) : undefined
      };

      const result = await this.auditService.getLogs(filters);

      res.json(result);
    } catch (error) {
      res.status(500).json({ 
        error: 'Error interno del servidor' 
      });
    }
  }

  async getStats(req: AuthRequest, res: Response): Promise<void> {
    try {
      const filters = {
        fechaInicio: req.query.fechaInicio ? new Date(req.query.fechaInicio as string) : undefined,
        fechaFin: req.query.fechaFin ? new Date(req.query.fechaFin as string) : undefined
      };

      const stats = await this.auditService.getStats(filters);

      res.json(stats);
    } catch (error) {
      res.status(500).json({ 
        error: 'Error interno del servidor' 
      });
    }
  }

  async getLogsByUser(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { userId } = req.params;
      const filters = {
        fechaInicio: req.query.fechaInicio ? new Date(req.query.fechaInicio as string) : undefined,
        fechaFin: req.query.fechaFin ? new Date(req.query.fechaFin as string) : undefined,
        accion: req.query.accion as string | undefined,
        page: req.query.page ? parseInt(req.query.page as string) : undefined,
        limit: req.query.limit ? parseInt(req.query.limit as string) : undefined
      };

      const result = await this.auditService.getLogsByUser(userId, filters);

      res.json(result);
    } catch (error) {
      res.status(500).json({ 
        error: 'Error interno del servidor' 
      });
    }
  }

  async exportLogs(req: AuthRequest, res: Response): Promise<void> {
    try {
      const filters = {
        fechaInicio: req.query.fechaInicio ? new Date(req.query.fechaInicio as string) : undefined,
        fechaFin: req.query.fechaFin ? new Date(req.query.fechaFin as string) : undefined,
        usuarioId: req.query.usuarioId as string | undefined,
        accion: req.query.accion as string | undefined,
        entidadAfectada: req.query.entidadAfectada as string | undefined,
        tipo: req.query.tipo as 'exito' | 'error' | 'advertencia' | undefined
      };

      const format = req.query.format as 'json' | 'csv' || 'json';
      const data = await this.auditService.exportLogs(filters, format);

      if (format === 'csv') {
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=audit-logs.csv');
        res.send(data);
      } else {
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', 'attachment; filename=audit-logs.json');
        res.json(data);
      }
    } catch (error) {
      res.status(500).json({ 
        error: 'Error interno del servidor' 
      });
    }
  }
}
