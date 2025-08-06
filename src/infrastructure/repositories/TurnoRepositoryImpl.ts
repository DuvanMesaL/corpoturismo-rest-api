import { PrismaClient } from '@prisma/client';
import { Turno, CreateTurnoDto, EstadoTurno } from '../../domain/entities/Turno';
import { TurnoRepository } from '../../domain/repositories/TurnoRepository';

const prisma = new PrismaClient();

export class TurnoRepositoryImpl implements TurnoRepository {
  async create(turnoData: CreateTurnoDto & { creadorId: string }): Promise<Turno> {
    const turno = await prisma.turno.create({
      data: {
        recaladaId: turnoData.recaladaId,
        creadorId: turnoData.creadorId,
        fechaInicio: turnoData.fechaInicio,
        fechaFin: turnoData.fechaFin,
        observaciones: turnoData.observaciones,
        estado: 'DISPONIBLE'
      },
      include: {
        recalada: {
          include: {
            buque: true,
            puertoOrigen: true,
            puertoDestino: true
          }
        },
        guia: {
          select: {
            id: true,
            email: true,
            primerNombre: true,
            primerApellido: true,
            rol: true
          }
        },
        creador: {
          select: {
            id: true,
            email: true,
            primerNombre: true,
            primerApellido: true,
            rol: true
          }
        },
        atenciones: true
      }
    });

    return this.mapPrismaTurnoToEntity(turno);
  }

  async findById(id: string): Promise<Turno | null> {
    const turno = await prisma.turno.findUnique({
      where: { id },
      include: {
        recalada: {
          include: {
            buque: true,
            puertoOrigen: true,
            puertoDestino: true
          }
        },
        guia: {
          select: {
            id: true,
            email: true,
            primerNombre: true,
            primerApellido: true,
            rol: true
          }
        },
        creador: {
          select: {
            id: true,
            email: true,
            primerNombre: true,
            primerApellido: true,
            rol: true
          }
        },
        atenciones: {
          include: {
            tipoAtencion: true
          }
        }
      }
    });

    return turno ? this.mapPrismaTurnoToEntity(turno) : null;
  }

  async findByRecalada(recaladaId: string): Promise<Turno[]> {
    const turnos = await prisma.turno.findMany({
      where: { recaladaId },
      include: {
        recalada: {
          include: {
            buque: true
          }
        },
        guia: {
          select: {
            id: true,
            email: true,
            primerNombre: true,
            primerApellido: true,
            rol: true
          }
        },
        creador: {
          select: {
            id: true,
            email: true,
            primerNombre: true,
            primerApellido: true,
            rol: true
          }
        }
      },
      orderBy: {
        fechaInicio: 'asc'
      }
    });

    return turnos.map(turno => this.mapPrismaTurnoToEntity(turno));
  }

  async findAvailable(filters?: {
    fechaInicio?: Date;
    fechaFin?: Date;
    recaladaId?: string;
  }): Promise<Turno[]> {
    const where: any = {
      estado: 'DISPONIBLE'
    };

    if (filters?.fechaInicio) {
      where.fechaInicio = { gte: filters.fechaInicio };
    }

    if (filters?.fechaFin) {
      where.fechaFin = { lte: filters.fechaFin };
    }

    if (filters?.recaladaId) {
      where.recaladaId = filters.recaladaId;
    }

    const turnos = await prisma.turno.findMany({
      where,
      include: {
        recalada: {
          include: {
            buque: true,
            puertoOrigen: true,
            puertoDestino: true
          }
        },
        creador: {
          select: {
            id: true,
            email: true,
            primerNombre: true,
            primerApellido: true,
            rol: true
          }
        }
      },
      orderBy: {
        fechaInicio: 'asc'
      }
    });

    return turnos.map(turno => this.mapPrismaTurnoToEntity(turno));
  }

  async findByGuia(guiaId: string, filters?: {
    estado?: EstadoTurno;
    fechaInicio?: Date;
    fechaFin?: Date;
  }): Promise<Turno[]> {
    const where: any = {
      guiaId
    };

    if (filters?.estado) {
      where.estado = filters.estado;
    }

    if (filters?.fechaInicio) {
      where.fechaInicio = { gte: filters.fechaInicio };
    }

    if (filters?.fechaFin) {
      where.fechaFin = { lte: filters.fechaFin };
    }

    const turnos = await prisma.turno.findMany({
      where,
      include: {
        recalada: {
          include: {
            buque: true,
            puertoOrigen: true,
            puertoDestino: true
          }
        },
        creador: {
          select: {
            id: true,
            email: true,
            primerNombre: true,
            primerApellido: true,
            rol: true
          }
        },
        atenciones: {
          include: {
            tipoAtencion: true
          }
        }
      },
      orderBy: {
        fechaInicio: 'desc'
      }
    });

    return turnos.map(turno => this.mapPrismaTurnoToEntity(turno));
  }

  async update(id: string, turnoData: Partial<Turno>): Promise<Turno> {
    const data = Object.fromEntries(
      Object.entries(turnoData).filter(([_, v]) => v !== undefined)
    );

    (data as any).updatedAt = new Date();

    const turno = await prisma.turno.update({
      where: { id },
      data,
      include: {
        recalada: {
          include: {
            buque: true,
            puertoOrigen: true,
            puertoDestino: true
          }
        },
        guia: {
          select: {
            id: true,
            email: true,
            primerNombre: true,
            primerApellido: true,
            rol: true
          }
        },
        creador: {
          select: {
            id: true,
            email: true,
            primerNombre: true,
            primerApellido: true,
            rol: true
          }
        },
        atenciones: {
          include: {
            tipoAtencion: true
          }
        }
      }
    });

    return this.mapPrismaTurnoToEntity(turno);
  }


  async tomarTurno(turnoId: string, guiaId: string): Promise<Turno> {
    const turno = await prisma.turno.update({
      where: { 
        id: turnoId,
        estado: 'DISPONIBLE' // Solo se puede tomar si está disponible
      },
      data: {
        guiaId,
        estado: 'TOMADO',
        updatedAt: new Date()
      },
      include: {
        recalada: {
          include: {
            buque: true,
            puertoOrigen: true,
            puertoDestino: true
          }
        },
        guia: {
          select: {
            id: true,
            email: true,
            primerNombre: true,
            primerApellido: true,
            rol: true
          }
        },
        creador: {
          select: {
            id: true,
            email: true,
            primerNombre: true,
            primerApellido: true,
            rol: true
          }
        }
      }
    });

    return this.mapPrismaTurnoToEntity(turno);
  }

  async liberarTurno(turnoId: string): Promise<Turno> {
    const turno = await prisma.turno.update({
      where: { 
        id: turnoId,
        estado: { in: ['TOMADO', 'EN_USO'] }
      },
      data: {
        guiaId: null,
        estado: 'DISPONIBLE',
        updatedAt: new Date()
      },
      include: {
        recalada: {
          include: {
            buque: true,
            puertoOrigen: true,
            puertoDestino: true
          }
        },
        creador: {
          select: {
            id: true,
            email: true,
            primerNombre: true,
            primerApellido: true,
            rol: true
          }
        }
      }
    });

    return this.mapPrismaTurnoToEntity(turno);
  }

  async usarTurno(turnoId: string, observaciones?: string): Promise<Turno> {
    const turno = await prisma.turno.update({
      where: { 
        id: turnoId,
        estado: 'TOMADO'
      },
      data: {
        estado: 'EN_USO',
        observaciones,
        updatedAt: new Date()
      },
      include: {
        recalada: {
          include: {
            buque: true,
            puertoOrigen: true,
            puertoDestino: true
          }
        },
        guia: {
          select: {
            id: true,
            email: true,
            primerNombre: true,
            primerApellido: true,
            rol: true
          }
        },
        creador: {
          select: {
            id: true,
            email: true,
            primerNombre: true,
            primerApellido: true,
            rol: true
          }
        }
      }
    });

    return this.mapPrismaTurnoToEntity(turno);
  }

  async terminarTurno(turnoId: string, horasTrabajadas?: number): Promise<Turno> {
    const turno = await prisma.turno.update({
      where: { 
        id: turnoId,
        estado: 'EN_USO'
      },
      data: {
        estado: 'FINALIZADO',
        horasTrabajadas,
        updatedAt: new Date()
      },
      include: {
        recalada: {
          include: {
            buque: true,
            puertoOrigen: true,
            puertoDestino: true
          }
        },
        guia: {
          select: {
            id: true,
            email: true,
            primerNombre: true,
            primerApellido: true,
            rol: true
          }
        },
        creador: {
          select: {
            id: true,
            email: true,
            primerNombre: true,
            primerApellido: true,
            rol: true
          }
        },
        atenciones: {
          include: {
            tipoAtencion: true
          }
        }
      }
    });

    return this.mapPrismaTurnoToEntity(turno);
  }

  async cancelarTurno(turnoId: string, motivo?: string): Promise<Turno> {
    const turno = await prisma.turno.update({
      where: { 
        id: turnoId,
        estado: { not: 'FINALIZADO' }
      },
      data: {
        estado: 'CANCELADO',
        observaciones: motivo,
        updatedAt: new Date()
      },
      include: {
        recalada: {
          include: {
            buque: true,
            puertoOrigen: true,
            puertoDestino: true
          }
        },
        guia: {
          select: {
            id: true,
            email: true,
            primerNombre: true,
            primerApellido: true,
            rol: true
          }
        },
        creador: {
          select: {
            id: true,
            email: true,
            primerNombre: true,
            primerApellido: true,
            rol: true
          }
        }
      }
    });

    return this.mapPrismaTurnoToEntity(turno);
  }

  async findAll(filters?: {
    estado?: EstadoTurno;
    guiaId?: string;
    recaladaId?: string;
    fechaInicio?: Date;
    fechaFin?: Date;
    page?: number;
    limit?: number;
  }): Promise<Turno[]> {
    const where: any = {};

    if (filters?.estado) {
      where.estado = filters.estado;
    }

    if (filters?.guiaId) {
      where.guiaId = filters.guiaId;
    }

    if (filters?.recaladaId) {
      where.recaladaId = filters.recaladaId;
    }

    if (filters?.fechaInicio) {
      where.fechaInicio = { gte: filters.fechaInicio };
    }

    if (filters?.fechaFin) {
      where.fechaFin = { lte: filters.fechaFin };
    }

    const page = filters?.page || 1;
    const limit = filters?.limit || 50;
    const skip = (page - 1) * limit;

    const turnos = await prisma.turno.findMany({
      where,
      include: {
        recalada: {
          include: {
            buque: true,
            puertoOrigen: true,
            puertoDestino: true
          }
        },
        guia: {
          select: {
            id: true,
            email: true,
            primerNombre: true,
            primerApellido: true,
            rol: true
          }
        },
        creador: {
          select: {
            id: true,
            email: true,
            primerNombre: true,
            primerApellido: true,
            rol: true
          }
        }
      },
      orderBy: {
        fechaInicio: 'desc'
      },
      skip,
      take: limit
    });

    return turnos.map(turno => this.mapPrismaTurnoToEntity(turno));
  }

  async delete(id: string): Promise<void> {
    await prisma.turno.delete({
      where: { id }
    });
  }

  private mapPrismaTurnoToEntity(prismaTurno: any): Turno {
    return {
      id: prismaTurno.id,
      recaladaId: prismaTurno.recaladaId,
      guiaId: prismaTurno.guiaId,
      creadorId: prismaTurno.creadorId,
      fechaInicio: prismaTurno.fechaInicio,
      fechaFin: prismaTurno.fechaFin,
      estado: prismaTurno.estado as EstadoTurno,
      observaciones: prismaTurno.observaciones,
      horasTrabajadas: prismaTurno.horasTrabajadas,
      createdAt: prismaTurno.createdAt,
      updatedAt: prismaTurno.updatedAt,
      recalada: prismaTurno.recalada,
      guia: prismaTurno.guia,
      creador: prismaTurno.creador,
      atenciones: prismaTurno.atenciones
    };
  }
}
