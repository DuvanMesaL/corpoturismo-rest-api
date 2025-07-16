import type { DataSource } from 'typeorm';
import { Role } from '../../modules/roles/entities/role.entity';
import { User, UserStatus } from '../../modules/users/entities/user.entity';
import {
  Buque,
  TipoBuque,
  EstadoBuque,
} from '../../modules/buques/entities/buque.entity';
import {
  Recalada,
  EstadoRecalada,
  TipoOperacion,
} from '../../modules/recaladas/entities/recalada.entity';
import {
  Atencion,
  TipoAtencion,
  EstadoAtencion,
  PrioridadAtencion,
} from '../../modules/atenciones/entities/atencion.entity';
import {
  Turno,
  EstadoTurno,
  TipoTurno,
} from '../../modules/turnos/entities/turno.entity';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';

export class CompleteDataSeeder {
  constructor(private dataSource: DataSource) {}

  async run(): Promise<void> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      console.log('🌱 Iniciando seeder completo...');

      // 1. Crear roles
      const rolesData = [
        { name: 'super_admin', description: 'Super Administrador del sistema' },
        { name: 'admin', description: 'Administrador' },
        { name: 'supervisor', description: 'Supervisor de operaciones' },
        { name: 'guia', description: 'Guía de turno' },
        { name: 'operador', description: 'Operador básico' },
      ];

      const roles: Role[] = [];
      for (const roleData of rolesData) {
        let role = await queryRunner.manager.findOne(Role, {
          where: { name: roleData.name },
        });
        if (!role) {
          role = queryRunner.manager.create(Role, roleData);
          role = await queryRunner.manager.save(role);
          console.log(`✅ Rol creado: ${roleData.name}`);
        }
        roles.push(role);
      }

      // 2. Crear usuarios
      const usersData = [
        {
          email: 'admin@sistema.com',
          password: 'Admin123!',
          firstName: 'Super',
          firstLastname: 'Admin',
          role: 'super_admin',
        },
        {
          email: 'supervisor@sistema.com',
          password: 'Super123!',
          firstName: 'Juan',
          firstLastname: 'Supervisor',
          role: 'supervisor',
        },
        {
          email: 'guia1@sistema.com',
          password: 'Guia123!',
          firstName: 'María',
          firstLastname: 'Guía',
          role: 'guia',
        },
        {
          email: 'guia2@sistema.com',
          password: 'Guia123!',
          firstName: 'Carlos',
          firstLastname: 'Operador',
          role: 'guia',
        },
      ];

      const users: User[] = [];
      for (const userData of usersData) {
        let user = await queryRunner.manager.findOne(User, {
          where: { email: userData.email },
        });
        if (!user) {
          const role = roles.find((r) => r.name === userData.role);
          const hashedPassword = await bcrypt.hash(userData.password, 12);

          user = queryRunner.manager.create(User, {
            uuid: uuidv4(),
            email: userData.email,
            password: hashedPassword,
            firstName: userData.firstName,
            firstLastname: userData.firstLastname,
            identificationType: 'CC',
            identificationNumber: Math.floor(
              Math.random() * 100000000,
            ).toString(),
            phoneNumber: `300${Math.floor(Math.random() * 10000000)}`,
            status: UserStatus.ACTIVE,
            isTemporary: false,
            role,
            activationDate: new Date(),
          });
          user = await queryRunner.manager.save(user);
          console.log(`✅ Usuario creado: ${userData.email}`);
        }
        users.push(user);
      }

      // 3. Crear buques
      const buquesData = [
        {
          codigo: 'BQ001',
          nombre: 'Estrella del Mar',
          bandera: 'Colombia',
          tipo: TipoBuque.CONTENEDORES,
          eslora: 180.5,
          manga: 32.2,
          tonelaje: 15000,
          estado: EstadoBuque.ACTIVO,
        },
        {
          codigo: 'BQ002',
          nombre: 'Viento del Norte',
          bandera: 'Panamá',
          tipo: TipoBuque.CARGA,
          eslora: 150.0,
          manga: 28.0,
          tonelaje: 12000,
          estado: EstadoBuque.ACTIVO,
        },
        {
          codigo: 'BQ003',
          nombre: 'Océano Azul',
          bandera: 'Ecuador',
          tipo: TipoBuque.TANQUERO,
          eslora: 200.0,
          manga: 35.0,
          tonelaje: 25000,
          estado: EstadoBuque.ACTIVO,
        },
      ];

      const buques: Buque[] = [];
      for (const buqueData of buquesData) {
        let buque = await queryRunner.manager.findOne(Buque, {
          where: { codigo: buqueData.codigo },
        });
        if (!buque) {
          buque = queryRunner.manager.create(Buque, buqueData);
          buque = await queryRunner.manager.save(buque);
          console.log(`✅ Buque creado: ${buqueData.nombre}`);
        }
        buques.push(buque);
      }

      // 4. Crear recaladas
      const now = new Date();
      const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

      const recaladasData = [
        {
          codigo: 'REC001',
          buque: buques[0],
          fechaArriboProgramada: tomorrow,
          fechaZarpeProgramada: new Date(
            tomorrow.getTime() + 2 * 24 * 60 * 60 * 1000,
          ),
          muelle: 'M1',
          posicion: 'A1',
          estado: EstadoRecalada.PROGRAMADA,
          tipoOperacion: TipoOperacion.DESCARGA,
          cargaProgramada: 500,
          mercancia: 'Contenedores',
          consignatario: 'Naviera del Pacífico',
        },
        {
          codigo: 'REC002',
          buque: buques[1],
          fechaArriboProgramada: nextWeek,
          fechaZarpeProgramada: new Date(
            nextWeek.getTime() + 3 * 24 * 60 * 60 * 1000,
          ),
          muelle: 'M2',
          posicion: 'B1',
          estado: EstadoRecalada.PROGRAMADA,
          tipoOperacion: TipoOperacion.CARGA_DESCARGA,
          cargaProgramada: 800,
          mercancia: 'Carga general',
          consignatario: 'Transportes Marítimos SA',
        },
        {
          codigo: 'REC003',
          buque: buques[2],
          fechaArriboProgramada: new Date(
            now.getTime() + 3 * 24 * 60 * 60 * 1000,
          ),
          fechaZarpeProgramada: new Date(
            now.getTime() + 5 * 24 * 60 * 60 * 1000,
          ),
          muelle: 'M3',
          posicion: 'C1',
          estado: EstadoRecalada.PROGRAMADA,
          tipoOperacion: TipoOperacion.DESCARGA,
          cargaProgramada: 1200,
          mercancia: 'Combustible',
          consignatario: 'Petróleo Nacional',
        },
      ];

      const recaladas: Recalada[] = [];
      for (const recaladaData of recaladasData) {
        let recalada = await queryRunner.manager.findOne(Recalada, {
          where: { codigo: recaladaData.codigo },
        });
        if (!recalada) {
          recalada = queryRunner.manager.create(Recalada, recaladaData);
          recalada = await queryRunner.manager.save(recalada);
          console.log(`✅ Recalada creada: ${recaladaData.codigo}`);
        }
        recaladas.push(recalada);
      }

      // 5. Crear atenciones
      const atencionesData = [
        {
          codigo: 'AT001',
          recalada: recaladas[0],
          tipo: TipoAtencion.PRACTICAJE,
          descripcion: 'Servicio de practicaje para entrada al puerto',
          estado: EstadoAtencion.PENDIENTE,
          prioridad: PrioridadAtencion.ALTA,
          fechaProgramada: new Date(tomorrow.getTime() - 2 * 60 * 60 * 1000), // 2 horas antes
          duracionEstimada: 60,
          responsable: users[1], // supervisor
        },
        {
          codigo: 'AT002',
          recalada: recaladas[0],
          tipo: TipoAtencion.AMARRE,
          descripcion: 'Amarre en muelle M1 posición A1',
          estado: EstadoAtencion.PENDIENTE,
          prioridad: PrioridadAtencion.NORMAL,
          fechaProgramada: tomorrow,
          duracionEstimada: 30,
          responsable: users[2], // guia1
        },
        {
          codigo: 'AT003',
          recalada: recaladas[0],
          tipo: TipoAtencion.DESCARGA,
          descripcion: 'Descarga de contenedores',
          estado: EstadoAtencion.PENDIENTE,
          prioridad: PrioridadAtencion.NORMAL,
          fechaProgramada: new Date(tomorrow.getTime() + 2 * 60 * 60 * 1000), // 2 horas después
          duracionEstimada: 480, // 8 horas
          responsable: users[3], // guia2
        },
        {
          codigo: 'AT004',
          recalada: recaladas[1],
          tipo: TipoAtencion.PRACTICAJE,
          descripcion: 'Servicio de practicaje para entrada al puerto',
          estado: EstadoAtencion.PENDIENTE,
          prioridad: PrioridadAtencion.NORMAL,
          fechaProgramada: new Date(nextWeek.getTime() - 2 * 60 * 60 * 1000),
          duracionEstimada: 60,
          responsable: users[1], // supervisor
        },
      ];

      const atenciones: Atencion[] = [];
      for (const atencionData of atencionesData) {
        let atencion = await queryRunner.manager.findOne(Atencion, {
          where: { codigo: atencionData.codigo },
        });
        if (!atencion) {
          atencion = queryRunner.manager.create(Atencion, atencionData);
          atencion = await queryRunner.manager.save(atencion);
          console.log(`✅ Atención creada: ${atencionData.codigo}`);
        }
        atenciones.push(atencion);
      }

      // 6. Crear turnos
      const turnosData = [
        {
          codigo: 'T001',
          atencion: atenciones[0],
          tipo: TipoTurno.PRIORITARIO,
          estado: EstadoTurno.DISPONIBLE,
          numeroTurno: 1,
          fechaCreacion: now,
          fechaProgramada: atenciones[0].fechaProgramada,
          tiempoEstimado: 60,
          usuarioCreador: users[1],
        },
        {
          codigo: 'T002',
          atencion: atenciones[1],
          tipo: TipoTurno.NORMAL,
          estado: EstadoTurno.DISPONIBLE,
          numeroTurno: 1,
          fechaCreacion: now,
          fechaProgramada: atenciones[1].fechaProgramada,
          tiempoEstimado: 30,
          usuarioCreador: users[1],
        },
        {
          codigo: 'T003',
          atencion: atenciones[2],
          tipo: TipoTurno.NORMAL,
          estado: EstadoTurno.DISPONIBLE,
          numeroTurno: 1,
          fechaCreacion: now,
          fechaProgramada: atenciones[2].fechaProgramada,
          tiempoEstimado: 120,
          usuarioCreador: users[1],
        },
        {
          codigo: 'T004',
          atencion: atenciones[2],
          tipo: TipoTurno.NORMAL,
          estado: EstadoTurno.DISPONIBLE,
          numeroTurno: 2,
          fechaCreacion: now,
          fechaProgramada: new Date(
            atenciones[2].fechaProgramada.getTime() + 2 * 60 * 60 * 1000,
          ),
          tiempoEstimado: 120,
          usuarioCreador: users[1],
        },
      ];

      for (const turnoData of turnosData) {
        let turno = await queryRunner.manager.findOne(Turno, {
          where: { codigo: turnoData.codigo },
        });
        if (!turno) {
          turno = queryRunner.manager.create(Turno, turnoData);
          turno = await queryRunner.manager.save(turno);
          console.log(`✅ Turno creado: ${turnoData.codigo}`);
        }
      }

      await queryRunner.commitTransaction();
      console.log('🎉 Seeder completo ejecutado exitosamente');
      console.log('\n📋 Datos creados:');
      console.log(`   👥 ${usersData.length} usuarios`);
      console.log(`   🚢 ${buquesData.length} buques`);
      console.log(`   ⚓ ${recaladasData.length} recaladas`);
      console.log(`   🔧 ${atencionesData.length} atenciones`);
      console.log(`   🎫 ${turnosData.length} turnos`);
      console.log('\n🔑 Credenciales de acceso:');
      usersData.forEach((user) => {
        console.log(`   ${user.email} / ${user.password}`);
      });
    } catch (error) {
      await queryRunner.rollbackTransaction();
      console.error('❌ Error ejecutando seeder completo:', error);
      throw error;
    } finally {
      await queryRunner.release();
    }
  }
}
