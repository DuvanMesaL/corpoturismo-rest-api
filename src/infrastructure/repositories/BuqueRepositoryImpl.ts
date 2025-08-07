import { PrismaClient } from "@prisma/client";
import { Buque, CreateBuqueDto } from "../../domain/entities/Buque";
import { BuqueRepository } from "../../domain/repositories/BuqueRepository";

const prisma = new PrismaClient();

export class BuqueRepositoryImpl implements BuqueRepository {
  async create(buqueData: CreateBuqueDto): Promise<Buque> {
    const buque = await prisma.buque.create({
      data: {
        nombre: buqueData.nombre,
        bandera: buqueData.bandera,
        eslora: buqueData.eslora,
        manga: buqueData.manga,
        calado: buqueData.calado,
        tonelaje: buqueData.tonelaje,
        tipoEmbarcacion: buqueData.tipoEmbarcacion,
      },
      include: {
        recaladas: {
          include: {
            puertoOrigen: true,
            puertoDestino: true,
          },
          orderBy: {
            fechaLlegada: "desc",
          },
          take: 5, // Solo las últimas 5 recaladas
        },
      },
    });

    return this.mapPrismaBuqueToEntity(buque);
  }

  async findById(id: string): Promise<Buque | null> {
    const buque = await prisma.buque.findUnique({
      where: { id },
      include: {
        recaladas: {
          include: {
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
          orderBy: {
            fechaLlegada: "desc",
          },
        },
      },
    });

    return buque ? this.mapPrismaBuqueToEntity(buque) : null;
  }

  async findByNombre(nombre: string): Promise<Buque | null> {
    const buque = await prisma.buque.findFirst({
      where: {
        nombre: {
          contains: nombre,
          mode: "insensitive",
        },
      },
      include: {
        recaladas: {
          include: {
            puertoOrigen: true,
            puertoDestino: true,
          },
          orderBy: {
            fechaLlegada: "desc",
          },
          take: 5,
        },
      },
    });

    return buque ? this.mapPrismaBuqueToEntity(buque) : null;
  }

  async update(id: string, buqueData: Partial<Buque>): Promise<Buque> {
    const { recaladas, ...safeData } = buqueData;

    const buque = await prisma.buque.update({
      where: { id },
      data: {
        ...safeData,
        updatedAt: new Date(),
      },
      include: {
        recaladas: {
          include: {
            puertoOrigen: true,
            puertoDestino: true,
          },
          orderBy: {
            fechaLlegada: "desc",
          },
          take: 5,
        },
      },
    });

    return this.mapPrismaBuqueToEntity(buque);
  }

  async findAll(filters?: {
    nombre?: string;
    bandera?: string;
    tipoEmbarcacion?: string;
    page?: number;
    limit?: number;
  }): Promise<Buque[]> {
    const where: any = {};

    if (filters?.nombre) {
      where.nombre = {
        contains: filters.nombre,
        mode: "insensitive",
      };
    }

    if (filters?.bandera) {
      where.bandera = {
        contains: filters.bandera,
        mode: "insensitive",
      };
    }

    if (filters?.tipoEmbarcacion) {
      where.tipoEmbarcacion = {
        contains: filters.tipoEmbarcacion,
        mode: "insensitive",
      };
    }

    const page = filters?.page || 1;
    const limit = filters?.limit || 50;
    const skip = (page - 1) * limit;

    const buques = await prisma.buque.findMany({
      where,
      include: {
        recaladas: {
          include: {
            puertoOrigen: true,
            puertoDestino: true,
          },
          orderBy: {
            fechaLlegada: "desc",
          },
          take: 3,
        },
      },
      orderBy: {
        nombre: "asc",
      },
      skip,
      take: limit,
    });

    return buques.map((buque: any) => this.mapPrismaBuqueToEntity(buque));
  }

  async delete(id: string): Promise<void> {
    await prisma.buque.delete({
      where: { id },
    });
  }

  private mapPrismaBuqueToEntity(prismaBuque: any): Buque {
    return {
      id: prismaBuque.id,
      nombre: prismaBuque.nombre,
      bandera: prismaBuque.bandera,
      eslora: prismaBuque.eslora,
      manga: prismaBuque.manga,
      calado: prismaBuque.calado,
      tonelaje: prismaBuque.tonelaje,
      tipoEmbarcacion: prismaBuque.tipoEmbarcacion,
      createdAt: prismaBuque.createdAt,
      updatedAt: prismaBuque.updatedAt,
      recaladas: prismaBuque.recaladas,
    };
  }
}
