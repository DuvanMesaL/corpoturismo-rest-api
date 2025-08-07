import { PrismaClient } from "@prisma/client";
import {
  Recalada,
  CreateRecaladaDto,
  EstadoRecalada,
} from "../../domain/entities/Recalada";
import { RecaladaRepository } from "../../domain/repositories/RecaladaRepository";

const prisma = new PrismaClient();

export class RecaladaRepositoryImpl implements RecaladaRepository {
  async create(recaladaData: CreateRecaladaDto): Promise<Recalada> {
    const recalada = await prisma.recalada.create({
      data: {
        buqueId: recaladaData.buqueId,
        puertoOrigenId: recaladaData.puertoOrigenId,
        puertoDestinoId: recaladaData.puertoDestinoId,
        fechaLlegada: recaladaData.fechaLlegada,
        fechaSalida: recaladaData.fechaSalida,
        numeroViaje: recaladaData.numeroViaje,
        observaciones: recaladaData.observaciones,
        estado: "PROGRAMADA",
      },
      include: {
        buque: true,
        puertoOrigen: true,
        puertoDestino: true,
        turnos: {
          include: {
            guia: {
              select: {
                id: true,
                email: true,
                primerNombre: true,
                primerApellido: true,
                rol: true,
              },
            },
            creador: {
              select: {
                id: true,
                email: true,
                primerNombre: true,
                primerApellido: true,
                rol: true,
              },
            },
          },
        },
        atenciones: {
          include: {
            tipoAtencion: true,
          },
        },
      },
    });

    return this.mapPrismaRecaladaToEntity(recalada);
  }

  async findById(id: string): Promise<Recalada | null> {
    const recalada = await prisma.recalada.findUnique({
      where: { id },
      include: {
        buque: true,
        puertoOrigen: true,
        puertoDestino: true,
        turnos: {
          include: {
            guia: {
              select: {
                id: true,
                email: true,
                primerNombre: true,
                primerApellido: true,
                rol: true,
              },
            },
            creador: {
              select: {
                id: true,
                email: true,
                primerNombre: true,
                primerApellido: true,
                rol: true,
              },
            },
            atenciones: {
              include: {
                tipoAtencion: true,
              },
            },
          },
          orderBy: {
            fechaInicio: "asc",
          },
        },
        atenciones: {
          include: {
            tipoAtencion: true,
            turno: {
              include: {
                guia: {
                  select: {
                    id: true,
                    email: true,
                    primerNombre: true,
                    primerApellido: true,
                  },
                },
              },
            },
          },
          orderBy: {
            fechaInicio: "asc",
          },
        },
      },
    });

    return recalada ? this.mapPrismaRecaladaToEntity(recalada) : null;
  }

  async findActive(fecha?: Date): Promise<Recalada[]> {
    const fechaConsulta = fecha || new Date();
    const inicioDia = new Date(fechaConsulta);
    inicioDia.setHours(0, 0, 0, 0);

    const finDia = new Date(fechaConsulta);
    finDia.setHours(23, 59, 59, 999);

    const recaladas = await prisma.recalada.findMany({
      where: {
        OR: [
          {
            // Recaladas que llegan hoy
            fechaLlegada: {
              gte: inicioDia,
              lte: finDia,
            },
          },
          {
            // Recaladas que están en puerto (llegaron antes y no han salido)
            fechaLlegada: {
              lt: finDia,
            },
            OR: [{ fechaSalida: null }, { fechaSalida: { gt: fechaConsulta } }],
          },
        ],
        estado: {
          in: ["PROGRAMADA", "EN_PUERTO"],
        },
      },
      include: {
        buque: true,
        puertoOrigen: true,
        puertoDestino: true,
        turnos: {
          where: {
            fechaInicio: {
              gte: inicioDia,
              lte: finDia,
            },
          },
          include: {
            guia: {
              select: {
                id: true,
                email: true,
                primerNombre: true,
                primerApellido: true,
                rol: true,
              },
            },
          },
          orderBy: {
            fechaInicio: "asc",
          },
        },
        atenciones: {
          where: {
            fechaInicio: {
              gte: inicioDia,
              lte: finDia,
            },
          },
          include: {
            tipoAtencion: true,
          },
          orderBy: {
            fechaInicio: "asc",
          },
        },
      },
      orderBy: {
        fechaLlegada: "asc",
      },
    });

    return recaladas.map((recalada: any) =>
      this.mapPrismaRecaladaToEntity(recalada)
    );
  }

  async findByBuque(buqueId: string): Promise<Recalada[]> {
    const recaladas = await prisma.recalada.findMany({
      where: { buqueId },
      include: {
        buque: true,
        puertoOrigen: true,
        puertoDestino: true,
        turnos: {
          include: {
            guia: {
              select: {
                id: true,
                email: true,
                primerNombre: true,
                primerApellido: true,
                rol: true,
              },
            },
          },
        },
      },
      orderBy: {
        fechaLlegada: "desc",
      },
    });

    return recaladas.map((recalada: any) =>
      this.mapPrismaRecaladaToEntity(recalada)
    );
  }

  async findByDateRange(
    fechaInicio: Date,
    fechaFin: Date
  ): Promise<Recalada[]> {
    const recaladas = await prisma.recalada.findMany({
      where: {
        fechaLlegada: {
          gte: fechaInicio,
          lte: fechaFin,
        },
      },
      include: {
        buque: true,
        puertoOrigen: true,
        puertoDestino: true,
        turnos: {
          include: {
            guia: {
              select: {
                id: true,
                email: true,
                primerNombre: true,
                primerApellido: true,
                rol: true,
              },
            },
          },
        },
      },
      orderBy: {
        fechaLlegada: "asc",
      },
    });

    return recaladas.map((recalada: any) =>
      this.mapPrismaRecaladaToEntity(recalada)
    );
  }

  async update(id: string, recaladaData: Partial<Recalada>): Promise<Recalada> {
    // Construcción segura del objeto data para Prisma
    const prismaData: any = {
      ...recaladaData,
      updatedAt: new Date(),
    };

    // Convertir IDs que puedan venir como string
    if (recaladaData.buqueId !== undefined) {
      prismaData.buqueId =
        typeof recaladaData.buqueId === "string"
          ? parseInt(recaladaData.buqueId)
          : recaladaData.buqueId;
    }

    if (recaladaData.puertoOrigenId !== undefined) {
      prismaData.puertoOrigenId =
        typeof recaladaData.puertoOrigenId === "string"
          ? parseInt(recaladaData.puertoOrigenId)
          : recaladaData.puertoOrigenId;
    }

    if (recaladaData.puertoDestinoId !== undefined) {
      prismaData.puertoDestinoId =
        typeof recaladaData.puertoDestinoId === "string"
          ? parseInt(recaladaData.puertoDestinoId)
          : recaladaData.puertoDestinoId;
    }

    const recalada = await prisma.recalada.update({
      where: { id },
      data: prismaData,
      include: {
        buque: true,
        puertoOrigen: true,
        puertoDestino: true,
        turnos: {
          include: {
            guia: {
              select: {
                id: true,
                email: true,
                primerNombre: true,
                primerApellido: true,
                rol: true,
              },
            },
          },
        },
        atenciones: {
          include: {
            tipoAtencion: true,
          },
        },
      },
    });

    return this.mapPrismaRecaladaToEntity(recalada);
  }

  async findAll(filters?: {
    estado?: EstadoRecalada;
    buqueId?: string;
    fechaInicio?: Date;
    fechaFin?: Date;
    puertoOrigenId?: string;
    puertoDestinoId?: string;
    page?: number;
    limit?: number;
  }): Promise<Recalada[]> {
    const where: any = {};

    if (filters?.estado) {
      where.estado = filters.estado;
    }

    if (filters?.buqueId) {
      where.buqueId = filters.buqueId;
    }

    if (filters?.puertoOrigenId) {
      where.puertoOrigenId = filters.puertoOrigenId;
    }

    if (filters?.puertoDestinoId) {
      where.puertoDestinoId = filters.puertoDestinoId;
    }

    if (filters?.fechaInicio || filters?.fechaFin) {
      where.fechaLlegada = {};
      if (filters.fechaInicio) {
        where.fechaLlegada.gte = filters.fechaInicio;
      }
      if (filters.fechaFin) {
        where.fechaLlegada.lte = filters.fechaFin;
      }
    }

    const page = filters?.page || 1;
    const limit = filters?.limit || 50;
    const skip = (page - 1) * limit;

    const recaladas = await prisma.recalada.findMany({
      where,
      include: {
        buque: true,
        puertoOrigen: true,
        puertoDestino: true,
        turnos: {
          include: {
            guia: {
              select: {
                id: true,
                email: true,
                primerNombre: true,
                primerApellido: true,
                rol: true,
              },
            },
          },
        },
      },
      orderBy: {
        fechaLlegada: "desc",
      },
      skip,
      take: limit,
    });

    return recaladas.map((recalada: any) =>
      this.mapPrismaRecaladaToEntity(recalada)
    );
  }

  async delete(id: string): Promise<void> {
    await prisma.recalada.delete({
      where: { id },
    });
  }

  private mapPrismaRecaladaToEntity(prismaRecalada: any): Recalada {
    return {
      id: prismaRecalada.id,
      buqueId: prismaRecalada.buqueId,
      puertoOrigenId: prismaRecalada.puertoOrigenId,
      puertoDestinoId: prismaRecalada.puertoDestinoId,
      fechaLlegada: prismaRecalada.fechaLlegada,
      fechaSalida: prismaRecalada.fechaSalida,
      numeroViaje: prismaRecalada.numeroViaje,
      observaciones: prismaRecalada.observaciones,
      estado: prismaRecalada.estado as EstadoRecalada,
      createdAt: prismaRecalada.createdAt,
      updatedAt: prismaRecalada.updatedAt,
      buque: prismaRecalada.buque,
      puertoOrigen: prismaRecalada.puertoOrigen,
      puertoDestino: prismaRecalada.puertoDestino,
      turnos: prismaRecalada.turnos,
      atenciones: prismaRecalada.atenciones,
    };
  }
}
