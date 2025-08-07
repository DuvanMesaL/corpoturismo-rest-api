import { v4 as uuidv4 } from "uuid";
import bcrypt from "bcryptjs";
import { UserRepository } from "../../domain/repositories/UserRepository";
import { UserRepositoryImpl } from "../../infrastructure/repositories/UserRepositoryImpl";
import { emailService } from "../../infrastructure/services/email.service";
import {
  logger,
  auditLogger,
} from "../../infrastructure/logging/winston-logger";
import { CreateUserDto, User } from "../../domain/entities/User";
import { generateTempPassword } from "../utils/password.utils";

export interface InviteUserResult {
  success: boolean;
  user?: User;
  error?: string;
}

export class UserService {
  private userRepository: UserRepository;

  constructor() {
    this.userRepository = new UserRepositoryImpl();
  }

  async inviteUser(
    userData: CreateUserDto,
    inviterInfo: { id: string; email: string; nombre: string }
  ): Promise<InviteUserResult> {
    try {
      // Verificar que el email no esté ya registrado
      const existingUser = await this.userRepository.findByEmail(
        userData.email
      );

      if (existingUser) {
        return {
          success: false,
          error: "Ya existe un usuario con este email",
        };
      }

      // Generar UUID y contraseña temporal
      const userUuid = uuidv4();
      const tempPassword = generateTempPassword();
      const hashedTempPassword = await bcrypt.hash(tempPassword, 12);

      // Crear usuario en la base de datos
      const newUser = await this.userRepository.create({
        ...userData,
        uuid: userUuid,
        password: hashedTempPassword,
      });

      // Enviar email de invitación
      const emailSent = await emailService.sendInvitationEmail(
        userData.email,
        tempPassword,
        userUuid,
        inviterInfo.nombre
      );

      if (!emailSent) {
        // Si falla el email, eliminar el usuario creado
        await this.userRepository.delete(newUser.id);
        return {
          success: false,
          error: "Error enviando email de invitación",
        };
      }

      // Log de auditoría
      auditLogger.log({
        usuario_id: inviterInfo.id,
        accion: "invitar_usuario",
        tipo: "exito",
        entidad_afectada: "usuarios",
        mensaje: `Usuario invitado: ${userData.email}`,
        detalles: {
          email_invitado: userData.email,
          rol_asignado: userData.rolId,
          uuid_generado: userUuid,
        },
      });

      logger.info(`✅ Usuario invitado exitosamente: ${userData.email}`);

      return {
        success: true,
        user: newUser,
      };
    } catch (error) {
      logger.error("Error en UserService.inviteUser:", error);
      return {
        success: false,
        error: "Error interno del servidor",
      };
    }
  }

  async getUsers(filters?: {
    estado?: "activo" | "inactivo";
    rolId?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    try {
      return await this.userRepository.findAll(filters);
    } catch (error) {
      logger.error("Error en UserService.getUsers:", error);
      throw error;
    }
  }

  async getUserById(id: string) {
    try {
      return await this.userRepository.findById(id);
    } catch (error) {
      logger.error("Error en UserService.getUserById:", error);
      throw error;
    }
  }

  async updateUser(
    id: string,
    updateData: Partial<User>,
    updaterInfo: { id: string; email: string }
  ) {
    try {
      const user = await this.userRepository.findById(id);

      if (!user) {
        throw new Error("Usuario no encontrado");
      }

      const updatedUser = await this.userRepository.update(id, updateData);

      // Log de auditoría
      auditLogger.log({
        usuario_id: updaterInfo.id,
        accion: "actualizar_usuario",
        tipo: "exito",
        entidad_afectada: "usuarios",
        mensaje: `Usuario actualizado: ${user.email}`,
        detalles: {
          usuario_actualizado: user.email,
          campos_modificados: Object.keys(updateData),
          valores_anteriores: Object.keys(updateData).reduce((acc, key) => {
            acc[key] = (user as any)[key];
            return acc;
          }, {} as any),
        },
      });

      return updatedUser;
    } catch (error) {
      logger.error("Error en UserService.updateUser:", error);
      throw error;
    }
  }

  async deleteUser(id: string, deleterInfo: { id: string; email: string }) {
    try {
      const user = await this.userRepository.findById(id);

      if (!user) {
        throw new Error("Usuario no encontrado");
      }

      // No permitir eliminar super admins
      if (user.rol?.nombre === "super_admin") {
        throw new Error("No se puede eliminar un Super Administrador");
      }

      await this.userRepository.delete(id);

      // Log de auditoría
      auditLogger.log({
        usuario_id: deleterInfo.id,
        accion: "eliminar_usuario",
        tipo: "exito",
        entidad_afectada: "usuarios",
        mensaje: `Usuario eliminado: ${user.email}`,
        detalles: {
          usuario_eliminado: user.email,
          rol_eliminado: user.rol?.nombre,
        },
      });

      logger.info(`🗑️ Usuario eliminado: ${user.email}`);
    } catch (error) {
      logger.error("Error en UserService.deleteUser:", error);
      throw error;
    }
  }

  async resendInvitation(
    userId: string,
    resenderInfo: { id: string; email: string; nombre: string }
  ): Promise<InviteUserResult> {
    try {
      const user = await this.userRepository.findById(userId);

      if (!user) {
        return {
          success: false,
          error: "Usuario no encontrado",
        };
      }

      if (user.estado === "activo") {
        return {
          success: false,
          error: "El usuario ya ha completado su registro",
        };
      }

      // Generar nueva contraseña temporal
      const tempPassword = generateTempPassword();
      const hashedTempPassword = await bcrypt.hash(tempPassword, 12);

      // Actualizar contraseña temporal y fecha de invitación
      await this.userRepository.update(userId, {
        password: hashedTempPassword,
        fechaInvitacion: new Date(),
      });

      // Reenviar email de invitación
      const emailSent = await emailService.sendInvitationEmail(
        user.email,
        tempPassword,
        user.uuid,
        resenderInfo.nombre
      );

      if (!emailSent) {
        return {
          success: false,
          error: "Error reenviando email de invitación",
        };
      }

      // Log de auditoría
      auditLogger.log({
        usuario_id: resenderInfo.id,
        accion: "reenviar_invitacion",
        tipo: "exito",
        entidad_afectada: "usuarios",
        mensaje: `Invitación reenviada a: ${user.email}`,
        detalles: {
          email_destinatario: user.email,
        },
      });

      return {
        success: true,
        user,
      };
    } catch (error) {
      logger.error("Error en UserService.resendInvitation:", error);
      return {
        success: false,
        error: "Error interno del servidor",
      };
    }
  }
}
