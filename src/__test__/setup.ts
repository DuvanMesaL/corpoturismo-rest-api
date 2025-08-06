import { PrismaClient } from '@prisma/client';
import mongoose from 'mongoose';

const prisma = new PrismaClient();

beforeAll(async () => {
  // Configurar base de datos de prueba
  process.env.DATABASE_URL = process.env.TEST_DATABASE_URL || 'postgresql://test:test@localhost:5432/corpoturismo_test';
  process.env.MONGODB_URI = process.env.TEST_MONGODB_URI || 'mongodb://localhost:27017/corpoturismo_test';
  process.env.JWT_SECRET = 'test-jwt-secret';
  
  // Conectar a MongoDB de prueba
  await mongoose.connect(process.env.MONGODB_URI);
});

afterAll(async () => {
  // Limpiar y cerrar conexiones
  await prisma.$disconnect();
  await mongoose.connection.close();
});

beforeEach(async () => {
  // Limpiar datos de prueba antes de cada test
  await prisma.user.deleteMany({});
  await prisma.role.deleteMany({});
  
  // Crear roles de prueba
  await prisma.role.createMany({
    data: [
      {
        id: 'test_role_admin',
        nombre: 'admin',
        descripcion: 'Administrador de prueba',
        permisos: ['usuarios:*']
      },
      {
        id: 'test_role_guia',
        nombre: 'guia',
        descripcion: 'Guía de prueba',
        permisos: ['turnos:tomar']
      }
    ]
  });
});
