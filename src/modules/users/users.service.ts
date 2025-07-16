import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import type { Repository } from 'typeorm';
import { type User, UserStatus } from './entities/user.entity';
import type { RolesService } from '../roles/roles.service';
import type { LogsService } from '../logs/logs.service';
import type { EmailService } from '../email/email.service';
import type { CreateUserDto } from './dto/create-user.dto';
import type { UpdateUserDto } from './dto/update-user.dto';
import type { InviteUserDto } from './dto/invite-user.dto';
import type { CompleteRegistrationDto } from './dto/complete-registration.dto';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class UsersService {
  constructor(
    private userRepository: Repository<User>,
    private rolesService: RolesService,
    private logsService: LogsService,
    private emailService: EmailService,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    // Verificar si el email ya existe
    const existingUser = await this.userRepository.findOne({
      where: { email: createUserDto.email },
    });

    if (existingUser) {
      throw new ConflictException('El email ya está registrado');
    }

    // Verificar que el rol existe
    const role = await this.rolesService.findOne(createUserDto.roleId);

    // Hash de la contraseña
    const hashedPassword = await bcrypt.hash(createUserDto.password, 12);

    const user = this.userRepository.create({
      ...createUserDto,
      uuid: uuidv4(),
      password: hashedPassword,
      role,
      status: UserStatus.ACTIVE,
      isTemporary: false,
    });

    const savedUser = await this.userRepository.save(user);

    // Log de creación
    await this.logsService.createLog({
      action: 'USER_CREATED',
      userId: savedUser.id,
      userEmail: savedUser.email,
      entityType: 'User',
      entityId: savedUser.id.toString(),
      message: `Usuario ${savedUser.email} creado`,
    });

    return savedUser;
  }

  async inviteUser(
    inviteUserDto: InviteUserDto,
    invitedByUserId: number,
  ): Promise<{ message: string; token: string }> {
    // Verificar si el email ya existe
    const existingUser = await this.userRepository.findOne({
      where: { email: inviteUserDto.email },
    });

    if (existingUser) {
      throw new ConflictException('El email ya está registrado');
    }

    // Verificar que el rol existe
    const role = await this.rolesService.findOne(inviteUserDto.roleId);
    const invitedByUser = await this.findOne(invitedByUserId);

    // Generar contraseña temporal
    const tempPassword = this.generateTempPassword();
    const hashedPassword = await bcrypt.hash(tempPassword, 12);

    // Generar token de invitación
    const invitationToken = this.generateInvitationToken();
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 48); // 48 horas

    const user = this.userRepository.create({
      uuid: uuidv4(),
      email: inviteUserDto.email,
      password: hashedPassword,
      role,
      status: UserStatus.INACTIVE,
      isTemporary: true,
      invitationDate: new Date(),
      invitedBy: invitedByUser,
      invitationToken,
      invitationExpiresAt: expiresAt,
    });

    const savedUser = await this.userRepository.save(user);

    // Enviar email de invitación
    const invitedByName = this.getFullName(invitedByUser);
    const emailSent = await this.emailService.sendInvitationEmail(
      savedUser.email,
      invitationToken,
      tempPassword,
      invitedByName,
    );

    // Log de invitación
    await this.logsService.createLog({
      action: 'USER_INVITED',
      userId: invitedByUserId,
      userEmail: invitedByUser.email,
      entityType: 'User',
      entityId: savedUser.id.toString(),
      message: `Usuario ${savedUser.email} invitado por ${invitedByUser.email}`,
      metadata: {
        invitedEmail: savedUser.email,
        emailSent,
        tempPassword: emailSent ? '[SENT]' : tempPassword, // Solo mostrar password si el email falló
      },
    });

    return {
      message: emailSent
        ? 'Invitación enviada exitosamente por correo electrónico'
        : `Invitación creada. Contraseña temporal: ${tempPassword}`,
      token: invitationToken,
    };
  }

  async completeRegistration(
    token: string,
    completeRegistrationDto: CompleteRegistrationDto,
    ipAddress: string,
    userAgent: string,
  ): Promise<{ message: string }> {
    // Buscar usuario por token
    const user = await this.userRepository.findOne({
      where: {
        invitationToken: token,
        status: UserStatus.INACTIVE,
        isTemporary: true,
      },
      relations: ['role'],
    });

    if (!user) {
      throw new NotFoundException('Token de invitación inválido');
    }

    // Verificar si el token no ha expirado
    if (user.invitationExpiresAt < new Date()) {
      throw new BadRequestException('El token de invitación ha expirado');
    }

    // Hash de la nueva contraseña
    const hashedPassword = await bcrypt.hash(
      completeRegistrationDto.password,
      12,
    );

    // Actualizar usuario
    Object.assign(user, {
      firstName: completeRegistrationDto.firstName,
      secondName: completeRegistrationDto.secondName,
      firstLastname: completeRegistrationDto.firstLastname,
      secondLastname: completeRegistrationDto.secondLastname,
      identificationType: completeRegistrationDto.identificationType,
      identificationNumber: completeRegistrationDto.identificationNumber,
      phoneNumber: completeRegistrationDto.phoneNumber,
      password: hashedPassword,
      status: UserStatus.ACTIVE,
      isTemporary: false,
      activationDate: new Date(),
      registrationIp: ipAddress,
      registrationDevice: userAgent,
      invitationToken: null,
      invitationExpiresAt: null,
    });

    await this.userRepository.save(user);

    // Enviar email de bienvenida
    const userName = this.getFullName(user);
    await this.emailService.sendWelcomeEmail(user.email, userName);

    // Log de activación
    await this.logsService.createLog({
      action: 'USER_ACTIVATED',
      userId: user.id,
      userEmail: user.email,
      entityType: 'User',
      entityId: user.id.toString(),
      ipAddress,
      userAgent,
      message: `Usuario ${user.email} completó su registro`,
    });

    return { message: 'Registro completado exitosamente' };
  }

  async findAll(): Promise<User[]> {
    return await this.userRepository.find({
      relations: ['role'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: number): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id },
      relations: ['role', 'invitedBy'],
    });

    if (!user) {
      throw new NotFoundException(`Usuario con ID ${id} no encontrado`);
    }

    return user;
  }

  async findByEmail(email: string): Promise<User> {
    return await this.userRepository.findOne({
      where: { email },
      relations: ['role'],
    });
  }

  async findByUuid(uuid: string): Promise<User> {
    return await this.userRepository.findOne({
      where: { uuid },
      relations: ['role'],
    });
  }

  async update(id: number, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.findOne(id);

    if (updateUserDto.password) {
      updateUserDto.password = await bcrypt.hash(updateUserDto.password, 12);
    }

    Object.assign(user, updateUserDto);
    return await this.userRepository.save(user);
  }

  async updateLastLogin(id: number): Promise<void> {
    await this.userRepository.update(id, { lastLogin: new Date() });
  }

  async remove(id: number): Promise<void> {
    const user = await this.findOne(id);
    await this.userRepository.softDelete(id);

    // Log de eliminación
    await this.logsService.createLog({
      action: 'USER_DELETED',
      userId: user.id,
      userEmail: user.email,
      entityType: 'User',
      entityId: user.id.toString(),
      message: `Usuario ${user.email} eliminado`,
    });
  }

  private generateTempPassword(): string {
    const length = Number.parseInt(process.env.TEMP_PASSWORD_LENGTH) || 8;
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  private generateInvitationToken(): string {
    return uuidv4() + '-' + Date.now().toString(36);
  }

  private getFullName(user: User): string {
    const parts = [
      user.firstName,
      user.secondName,
      user.firstLastname,
      user.secondLastname,
    ].filter(Boolean);
    return parts.join(' ');
  }
}
