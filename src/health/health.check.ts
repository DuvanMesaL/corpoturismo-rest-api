import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';

async function healthCheck() {
  try {
    const app = await NestFactory.create(AppModule, { logger: false });
    await app.init();

    // Verificar conexión a base de datos
    const dataSource = app.get('DataSource');
    await dataSource.query('SELECT 1');

    await app.close();
    process.exit(0);
  } catch (error) {
    console.error('Health check failed:', error);
    process.exit(1);
  }
}

healthCheck();
