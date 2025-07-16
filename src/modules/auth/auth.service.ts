import { Injectable, UnauthorizedException } from '@nestjs/common';
import type { JwtService } from '@nestjs/jwt';
import type { UsersService } from '../users/users.service';
import type { LogsService } from '../logs/logs.service';
import type { LoginDto } from './dto/login.dto';
import type { User } from '../users/entities/user.entity';
import { UserStatus } from '../users/entities/user.entity';
import * as bcrypt from 'bcrypt';

export interface JwtPayload {
  sub: number;
  email: string;
  role: string;
  uuid: string;
  iat?: number;
  exp?: number;
}

export interface LoginResponse {
  access_token: string;
  refresh_token: string;
  user: {
    id: number;
    email: string;
    fullName: string;
    role: string;
    status: string;
  };
}

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private logsService: LogsService,
  ) {}

  async validateUser(email: string, password: string): Promise<User | null> {
    const user = await this.usersService.findByEmail(email);

    if (!user) {
      return null;
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return null;
    }

    return user;
  }

  async login(
    loginDto: LoginDto,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<LoginResponse> {
    const user = await this.validateUser(loginDto.email, loginDto.password);

    if (!user) {
      // Log intento de login fallido
      await this.logsService.createLog({
        action: 'LOGIN_FAILED',
        userId: 0,
        userEmail: loginDto.email,
        ipAddress,
        userAgent,
        level: 'warning',
        message: `Intento de login fallido para ${loginDto.email}`,
      });
      throw new UnauthorizedException('Credenciales inválidas');
    }

    if (user.status !== UserStatus.ACTIVE) {
      await this.logsService.createLog({
        action: 'LOGIN_BLOCKED',
        userId: user.id,
        userEmail: user.email,
        ipAddress,
        userAgent,
        level: 'warning',
        message: `Login bloqueado - usuario inactivo: ${user.email}`,
      });
      throw new UnauthorizedException('Usuario inactivo o suspendido');
    }

    // Actualizar último login
    await this.usersService.updateLastLogin(user.id);

    // Generar tokens
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role.name,
      uuid: user.uuid,
    };

    const access_token = this.jwtService.sign(payload);
    const refresh_token = this.jwtService.sign(payload, { expiresIn: '7d' });

    // Log login exitoso
    await this.logsService.createLog({
      action: 'LOGIN_SUCCESS',
      userId: user.id,
      userEmail: user.email,
      ipAddress,
      userAgent,
      level: 'info',
      message: `Login exitoso para ${user.email}`,
    });

    return {
      access_token,
      refresh_token,
      user: {
        id: user.id,
        email: user.email,
        fullName: this.getFullName(user),
        role: user.role.name,
        status: user.status,
      },
    };
  }

  async refreshToken(refreshToken: string): Promise<{ access_token: string }> {
    try {
      const payload = this.jwtService.verify(refreshToken);
      const user = await this.usersService.findOne(payload.sub);

      if (!user || user.status !== UserStatus.ACTIVE) {
        throw new UnauthorizedException('Usuario no válido');
      }

      const newPayload: JwtPayload = {
        sub: user.id,
        email: user.email,
        role: user.role.name,
        uuid: user.uuid,
      };

      return {
        access_token: this.jwtService.sign(newPayload),
      };
    } catch (error) {
      throw new UnauthorizedException('Token de refresh inválido');
    }
  }

  async getProfile(userId: number): Promise<User> {
    return await this.usersService.findOne(userId);
  }

  async logout(
    userId: number,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<{ message: string }> {
    const user = await this.usersService.findOne(userId);

    await this.logsService.createLog({
      action: 'LOGOUT',
      userId: user.id,
      userEmail: user.email,
      ipAddress,
      userAgent,
      level: 'info',
      message: `Logout para ${user.email}`,
    });

    return { message: 'Logout exitoso' };
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
