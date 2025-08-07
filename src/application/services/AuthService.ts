import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { UserRepository } from '../../domain/repositories/UserRepository';
import { UserRepositoryImpl } from '../../infrastructure/repositories/UserRepositoryImpl';
import { emailService } from '../../infrastructure/services/email.service';
import { logger } from '../../infrastructure/logging/winston-logger';
import { CompleteRegistrationDto, LoginDto } from '../../domain/entities/User';
import { generateTempPassword } from '../utils/password.utils';

export interface LoginResult {
  success: boolean;
  token?: string;
  user?: any;
  error?: string;
}

export interface RegistrationResult {
  success: boolean;
  token?: string;
  user?: any;
  error?: string;
}

export class AuthService {
  private userRepository: UserRepository;

  constructor() {
    this.userRepository = new UserRepositoryImpl();
  }

  async login(
    email: string, 
    password: string,
    metadata: { ip?: string; userAgent?: string }
  ): Promise<LoginResult> {
    try {
      // Buscar usuario por email
      const user = await this.userRepository.findByEmail(email);
      
      if (!user) {
        return {
          success: false,
          error: 'Credenciales inválidas'
        };
      }

      // Verificar estado del usuario
      if (user.estado !== 'activo') {
        return {
          success: false,
          error: 'Usuario inactivo. Completa tu registro primero.'
        };
      }

      // Verificar contraseña
      if (!user.password) {
        return {
          success: false,
          error: 'Usuario sin contraseña configurada'
        };
      }

      const isValidPassword = await bcrypt.compare(password, user.password);
      
      if (!isValidPassword) {
        return {
          success: false,
          error: 'Credenciales inválidas'
        };
      }

      // Generar token JWT
      const token = this.generateToken(user.id);

      // Actualizar último acceso (opcional)
      await this.userRepository.update(user.id, {
        ipRegistro: metadata.ip,
        dispositivoRegistro: metadata.userAgent
      });

      return {
        success: true,
        token,
        user: {
          id: user.id,
          uuid: user.uuid,
          email: user.email,
          primerNombre: user.primerNombre,
          primerApellido: user.primerApellido,
          rol: user.rol
        }
      };
    } catch (error) {
      logger.error('Error en AuthService.login:', error);
      return {
        success: false,
        error: 'Error interno del servidor'
      };
    }
  }

  async completeRegistration(
    data: CompleteRegistrationDto,
    metadata: { ip?: string; userAgent?: string }
  ): Promise<RegistrationResult> {
    try {
      // Buscar usuario por UUID
      const user = await this.userRepository.findByUuid(data.uuid);
      
      if (!user) {
        return {
          success: false,
          error: 'Token de invitación inválido'
        };
      }

      // Verificar que el usuario esté en estado inactivo y sea temporal
      if (user.estado !== 'inactivo' || !user.esTemporal) {
        return {
          success: false,
          error: 'Este usuario ya ha completado su registro'
        };
      }

      // Verificar que la invitación no haya expirado (48 horas)
      const invitationAge = Date.now() - user.fechaInvitacion.getTime();
      const maxAge = 48 * 60 * 60 * 1000; // 48 horas en ms
      
      if (invitationAge > maxAge) {
        return {
          success: false,
          error: 'La invitación ha expirado. Solicita una nueva invitación.'
        };
      }

      // Validar contraseñas
      if (data.password !== data.confirmPassword) {
        return {
          success: false,
          error: 'Las contraseñas no coinciden'
        };
      }

      // Validar fortaleza de contraseña
      const passwordValidation = this.validatePassword(data.password);
      if (!passwordValidation.isValid) {
        return {
          success: false,
          error: passwordValidation.error
        };
      }

      // Hash de la nueva contraseña
      const hashedPassword = await bcrypt.hash(data.password, 12);

      // Completar registro
      const updatedUser = await this.userRepository.completeRegistration(data.uuid, {
        ...data,
        password: hashedPassword
      });

      // Actualizar metadatos
      await this.userRepository.update(updatedUser.id, {
        estado: 'activo',
        fechaActivacion: new Date(),
        ipRegistro: metadata.ip,
        dispositivoRegistro: metadata.userAgent,
        esTemporal: false
      });

      // Enviar email de bienvenida
      const nombreCompleto = `${data.primerNombre} ${data.primerApellido}`;
      await emailService.sendWelcomeEmail(updatedUser.email, nombreCompleto);

      // Generar token JWT
      const token = this.generateToken(updatedUser.id);

      // Obtener usuario actualizado con rol
      const finalUser = await this.userRepository.findById(updatedUser.id);

      return {
        success: true,
        token,
        user: {
          id: finalUser!.id,
          uuid: finalUser!.uuid,
          email: finalUser!.email,
          primerNombre: finalUser!.primerNombre,
          primerApellido: finalUser!.primerApellido,
          rol: finalUser!.rol
        }
      };
    } catch (error) {
      logger.error('Error en AuthService.completeRegistration:', error);
      return {
        success: false,
        error: 'Error interno del servidor'
      };
    }
  }

  async getCurrentUser(userId: string) {
    try {
      return await this.userRepository.findById(userId);
    } catch (error) {
      logger.error('Error en AuthService.getCurrentUser:', error);
      return null;
    }
  }

  async refreshToken(userId: string): Promise<string> {
    return this.generateToken(userId);
  }

  private generateToken(userId: string): string {
    return jwt.sign(
      { userId },
      process.env.JWT_SECRET!,
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' } as any
    );
  }

  private validatePassword(password: string): { isValid: boolean; error?: string } {
    if (password.length < 8) {
      return {
        isValid: false,
        error: 'La contraseña debe tener al menos 8 caracteres'
      };
    }

    if (!/(?=.*[a-z])/.test(password)) {
      return {
        isValid: false,
        error: 'La contraseña debe contener al menos una letra minúscula'
      };
    }

    if (!/(?=.*[A-Z])/.test(password)) {
      return {
        isValid: false,
        error: 'La contraseña debe contener al menos una letra mayúscula'
      };
    }

    if (!/(?=.*\d)/.test(password)) {
      return {
        isValid: false,
        error: 'La contraseña debe contener al menos un número'
      };
    }

    if (!/(?=.*[@$!%*?&])/.test(password)) {
      return {
        isValid: false,
        error: 'La contraseña debe contener al menos un carácter especial (@$!%*?&)'
      };
    }

    return { isValid: true };
  }
}
