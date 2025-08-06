import { AuthService } from '../../application/services/AuthService';
import { UserRepositoryImpl } from '../../infrastructure/repositories/UserRepositoryImpl';
import bcrypt from 'bcryptjs';

// Mock del repositorio
jest.mock('../../infrastructure/repositories/UserRepositoryImpl');
jest.mock('../../infrastructure/services/email.service');

describe('AuthService', () => {
  let authService: AuthService;
  let mockUserRepository: jest.Mocked<UserRepositoryImpl>;

  beforeEach(() => {
    authService = new AuthService();
    mockUserRepository = new UserRepositoryImpl() as jest.Mocked<UserRepositoryImpl>;
    (authService as any).userRepository = mockUserRepository;
  });

  describe('login', () => {
    it('should login successfully with valid credentials', async () => {
      const mockUser = {
        id: 'user1',
        email: 'test@example.com',
        password: await bcrypt.hash('password123', 12),
        estado: 'activo',
        rol: { id: 'role1', nombre: 'admin', permisos: [] }
      };

      mockUserRepository.findByEmail.mockResolvedValue(mockUser as any);
      mockUserRepository.update.mockResolvedValue(mockUser as any);

      const result = await authService.login('test@example.com', 'password123', {
        ip: '127.0.0.1',
        userAgent: 'test-agent'
      });

      expect(result.success).toBe(true);
      expect(result.token).toBeDefined();
      expect(result.user?.email).toBe('test@example.com');
    });

    it('should fail login with invalid email', async () => {
      mockUserRepository.findByEmail.mockResolvedValue(null);

      const result = await authService.login('invalid@example.com', 'password123', {});

      expect(result.success).toBe(false);
      expect(result.error).toBe('Credenciales inválidas');
    });

    it('should fail login with inactive user', async () => {
      const mockUser = {
        id: 'user1',
        email: 'test@example.com',
        password: 'hashedpassword',
        estado: 'inactivo'
      };

      mockUserRepository.findByEmail.mockResolvedValue(mockUser as any);

      const result = await authService.login('test@example.com', 'password123', {});

      expect(result.success).toBe(false);
      expect(result.error).toBe('Usuario inactivo. Completa tu registro primero.');
    });
  });

  describe('completeRegistration', () => {
    it('should complete registration successfully', async () => {
      const mockUser = {
        id: 'user1',
        uuid: 'test-uuid',
        email: 'test@example.com',
        estado: 'inactivo',
        esTemporal: true,
        fechaInvitacion: new Date(Date.now() - 1000 * 60 * 60), // 1 hour ago
        rol: { id: 'role1', nombre: 'guia', permisos: [] }
      };

      const registrationData = {
        uuid: 'test-uuid',
        tipoIdentificacion: 'CC',
        numeroIdentificacion: '12345678',
        primerNombre: 'Juan',
        primerApellido: 'Pérez',
        telefono: '3001234567',
        password: 'NewPassword123!',
        confirmPassword: 'NewPassword123!'
      };

      mockUserRepository.findByUuid.mockResolvedValue(mockUser as any);
      mockUserRepository.completeRegistration.mockResolvedValue({
        ...mockUser,
        ...registrationData,
        estado: 'activo'
      } as any);
      mockUserRepository.update.mockResolvedValue(mockUser as any);
      mockUserRepository.findById.mockResolvedValue({
        ...mockUser,
        ...registrationData,
        estado: 'activo'
      } as any);

      const result = await authService.completeRegistration(registrationData, {
        ip: '127.0.0.1',
        userAgent: 'test-agent'
      });

      expect(result.success).toBe(true);
      expect(result.token).toBeDefined();
      expect(result.user?.email).toBe('test@example.com');
    });

    it('should fail with expired invitation', async () => {
      const mockUser = {
        id: 'user1',
        uuid: 'test-uuid',
        email: 'test@example.com',
        estado: 'inactivo',
        esTemporal: true,
        fechaInvitacion: new Date(Date.now() - 1000 * 60 * 60 * 49) // 49 hours ago
      };

      mockUserRepository.findByUuid.mockResolvedValue(mockUser as any);

      const registrationData = {
        uuid: 'test-uuid',
        tipoIdentificacion: 'CC',
        numeroIdentificacion: '12345678',
        primerNombre: 'Juan',
        primerApellido: 'Pérez',
        telefono: '3001234567',
        password: 'NewPassword123!',
        confirmPassword: 'NewPassword123!'
      };

      const result = await authService.completeRegistration(registrationData, {});

      expect(result.success).toBe(false);
      expect(result.error).toBe('La invitación ha expirado. Solicita una nueva invitación.');
    });
  });
});
