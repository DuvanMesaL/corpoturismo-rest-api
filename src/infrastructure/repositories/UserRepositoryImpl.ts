import { PrismaClient } from "@prisma/client";
import {
  User,
  CreateUserDto,
  CompleteRegistrationDto,
} from "../../domain/entities/User";
import { UserRepository } from "../../domain/repositories/UserRepository";

const prisma = new PrismaClient();

export class UserRepositoryImpl implements UserRepository {
  async create(
    userData: CreateUserDto & { uuid: string; password: string }
  ): Promise<User> {
    const user = await prisma.user.create({
      data: {
        uuid: userData.uuid,
        email: userData.email,
        password: userData.password,
        rolId: userData.rolId,
        usuarioInvitadorId: userData.usuarioInvitadorId,
        estado: "INACTIVO",
        esTemporal: true,
        fechaInvitacion: new Date(),
      },
      include: {
        rol: true,
        usuarioInvitador: {
          select: {
            id: true,
            email: true,
            primerNombre: true,
            primerApellido: true,
          },
        },
      },
    });

    return this.mapPrismaUserToEntity(user);
  }

  async findByEmail(email: string): Promise<User | null> {
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        rol: true,
        usuarioInvitador: {
          select: {
            id: true,
            email: true,
            primerNombre: true,
            primerApellido: true,
          },
        },
      },
    });

    return user ? this.mapPrismaUserToEntity(user) : null;
  }

  async findByUuid(uuid: string): Promise<User | null> {
    const user = await prisma.user.findUnique({
      where: { uuid },
      include: {
        rol: true,
        usuarioInvitador: {
          select: {
            id: true,
            email: true,
            primerNombre: true,
            primerApellido: true,
          },
        },
      },
    });

    return user ? this.mapPrismaUserToEntity(user) : null;
  }

  async findById(id: string): Promise<User | null> {
    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        rol: true,
        usuarioInvitador: {
          select: {
            id: true,
            email: true,
            primerNombre: true,
            primerApellido: true,
          },
        },
      },
    });

    return user ? this.mapPrismaUserToEntity(user) : null;
  }

  async update(id: string, userData: Partial<User>): Promise<User> {
    const prismaData: any = {
      ...userData,
      updatedAt: new Date(),
    };

    if (userData.rolId !== undefined) {
      prismaData.rolId =
        typeof userData.rolId === "string"
          ? parseInt(userData.rolId)
          : userData.rolId;
    }

    const user = await prisma.user.update({
      where: { id },
      data: prismaData,
      include: {
        rol: true,
        usuarioInvitador: {
          select: {
            id: true,
            email: true,
            primerNombre: true,
            primerApellido: true,
          },
        },
      },
    });

    return this.mapPrismaUserToEntity(user);
  }

  async completeRegistration(
    uuid: string,
    data: CompleteRegistrationDto
  ): Promise<User> {
    const user = await prisma.user.update({
      where: { uuid },
      data: {
        tipoIdentificacion: data.tipoIdentificacion,
        numeroIdentificacion: data.numeroIdentificacion,
        primerNombre: data.primerNombre,
        segundoNombre: data.segundoNombre,
        primerApellido: data.primerApellido,
        segundoApellido: data.segundoApellido,
        telefono: data.telefono,
        password: data.password,
        estado: "ACTIVO",
        fechaActivacion: new Date(),
        esTemporal: false,
        updatedAt: new Date(),
      },
      include: {
        rol: true,
        usuarioInvitador: {
          select: {
            id: true,
            email: true,
            primerNombre: true,
            primerApellido: true,
          },
        },
      },
    });

    return this.mapPrismaUserToEntity(user);
  }

  async findAll(filters?: {
    estado?: "activo" | "inactivo";
    rolId?: string;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<User[]> {
    const where: any = {};

    if (filters?.estado) {
      where.estado = filters.estado.toUpperCase();
    }

    if (filters?.rolId) {
      where.rolId = filters.rolId;
    }

    if (filters?.search) {
      where.OR = [
        { email: { contains: filters.search, mode: "insensitive" } },
        { primerNombre: { contains: filters.search, mode: "insensitive" } },
        { primerApellido: { contains: filters.search, mode: "insensitive" } },
        {
          numeroIdentificacion: {
            contains: filters.search,
            mode: "insensitive",
          },
        },
      ];
    }

    const page = filters?.page || 1;
    const limit = filters?.limit || 50;
    const skip = (page - 1) * limit;

    const users = await prisma.user.findMany({
      where,
      include: {
        rol: true,
        usuarioInvitador: {
          select: {
            id: true,
            email: true,
            primerNombre: true,
            primerApellido: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      skip,
      take: limit,
    });

    return users.map((user: any) => this.mapPrismaUserToEntity(user));
  }

  async delete(id: string): Promise<void> {
    await prisma.user.delete({
      where: { id },
    });
  }

  private mapPrismaUserToEntity(prismaUser: any): User {
    return {
      id: prismaUser.id,
      uuid: prismaUser.uuid,
      email: prismaUser.email,
      password: prismaUser.password,
      tipoIdentificacion: prismaUser.tipoIdentificacion,
      numeroIdentificacion: prismaUser.numeroIdentificacion,
      primerNombre: prismaUser.primerNombre,
      segundoNombre: prismaUser.segundoNombre,
      primerApellido: prismaUser.primerApellido,
      segundoApellido: prismaUser.segundoApellido,
      telefono: prismaUser.telefono,
      rolId: prismaUser.rolId,
      estado: prismaUser.estado.toLowerCase() as "activo" | "inactivo",
      fechaInvitacion: prismaUser.fechaInvitacion,
      fechaActivacion: prismaUser.fechaActivacion,
      usuarioInvitadorId: prismaUser.usuarioInvitadorId,
      ipRegistro: prismaUser.ipRegistro,
      dispositivoRegistro: prismaUser.dispositivoRegistro,
      esTemporal: prismaUser.esTemporal,
      createdAt: prismaUser.createdAt,
      updatedAt: prismaUser.updatedAt,
      rol: prismaUser.rol
        ? {
            id: prismaUser.rol.id,
            nombre: prismaUser.rol.nombre,
            descripcion: prismaUser.rol.descripcion,
            permisos: prismaUser.rol.permisos,
            createdAt: prismaUser.rol.createdAt,
            updatedAt: prismaUser.rol.updatedAt,
          }
        : undefined,
    };
  }
}
