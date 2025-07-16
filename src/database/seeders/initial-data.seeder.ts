import type { DataSource } from 'typeorm';
import { Role } from '../../modules/roles/entities/role.entity';
import { User, UserStatus } from '../../modules/users/entities/user.entity';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { Buque } from '../../modules/buques/entities/buque.entity';

export class InitialDataSeeder {
  constructor(private dataSource: DataSource) {}

  async run(): Promise<void> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Crear roles
      const rolesData = [
        { name: 'super_admin', description: 'Super Administrador del sistema' },
        { name: 'admin', description: 'Administrador' },
        { name: 'supervisor', description: 'Supervisor de operaciones' },
        { name: 'guia', description: 'Guía de turno' },
        { name: 'operador', description: 'Operador básico' },
      ];

      const roles: Role[] = [];
      for (const roleData of rolesData) {
        const existingRole = await queryRunner.manager.findOne(Role, {
          where: { name: roleData.name },
        });

        if (!existingRole) {
          const role = queryRunner.manager.create(Role, roleData);
          const savedRole = await queryRunner.manager.save(role);
          roles.push(savedRole);
          console.log(`✅ Rol creado: ${roleData.name}`);
        } else {
          roles.push(existingRole);
          console.log(`ℹ️  Rol ya existe: ${roleData.name}`);
        }
      }

      // Crear usuario super admin
      const superAdminRole = roles.find((r) => r.name === 'super_admin');
      const existingAdmin = await queryRunner.manager.findOne(User, {
        where: { email: 'admin@sistema.com' },
      });

      if (!existingAdmin && superAdminRole) {
        const hashedPassword = await bcrypt.hash('Admin123!', 12);

        const adminUser = queryRunner.manager.create(User, {
          uuid: uuidv4(),
          email: 'admin@sistema.com',
          password: hashedPassword,
          firstName: 'Super',
          firstLastname: 'Admin',
          identificationType: 'CC',
          identificationNumber: '12345678',
          phoneNumber: '3001234567',
          status: UserStatus.ACTIVE,
          isTemporary: false,
          role: superAdminRole,
          activationDate: new Date(),
        });

        await queryRunner.manager.save(adminUser);
        console.log('✅ Usuario Super Admin creado:');
        console.log('   Email: admin@sistema.com');
        console.log('   Password: Admin123!');
      } else {
        console.log('ℹ️  Usuario Super Admin ya existe');
      }

      // Crear buque de prueba
      const buqueData = {
        codigo: 'BQ001',
        nombre: 'Buque de Prueba',
        bandera: 'Colombia',
        tipo: 'carga',
        estado: 'activo',
      };

      const existingBuque = await queryRunner.manager.findOne(Buque, {
        where: { codigo: buqueData.codigo },
      });

      if (!existingBuque) {
        const buque = queryRunner.manager.create(Buque, buqueData);
        await queryRunner.manager.save(buque);
        console.log('✅ Buque de prueba creado');
      } else {
        console.log('ℹ️  Buque de prueba ya existe');
      }

      await queryRunner.commitTransaction();
      console.log('🎉 Seeder ejecutado exitosamente');
    } catch (error) {
      await queryRunner.rollbackTransaction();
      console.error('❌ Error ejecutando seeder:', error);
      throw error;
    } finally {
      await queryRunner.release();
    }
  }
}
