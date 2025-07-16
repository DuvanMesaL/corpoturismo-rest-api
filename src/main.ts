import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import helmet from 'helmet';
import * as compression from 'compression';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log', 'debug', 'verbose'],
  });

  const configService = app.get(ConfigService);
  const logger = new Logger('Bootstrap');

  // Seguridad
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", 'data:', 'https:'],
        },
      },
    }),
  );

  // Compresión
  app.use(compression());

  // Configuración global de validación
  // Exception filter global
  app.useGlobalFilters(new HttpExceptionFilter());

  // Configuración de CORS más específica
  app.enableCors({
    origin: configService.get('FRONTEND_URL') || 'http://localhost:3000',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  });

  // Prefijo global para todas las rutas
  app.setGlobalPrefix('api/v1');

  // Configuración de timezone
  process.env.TZ = 'America/Bogota';

  const port = configService.get('PORT') || 3001;

  await app.listen(port);

  logger.log(`🚀 API corriendo en: http://localhost:${port}/api/v1`);
  logger.log(`🌍 Entorno: ${configService.get('NODE_ENV') || 'development'}`);
  logger.log(
    `🗄️  Base de datos: ${configService.get('DB_HOST')}:${configService.get('DB_PORT')}`,
  );

  // Graceful shutdown
  process.on('SIGTERM', async () => {
    logger.log('SIGTERM received, shutting down gracefully');
    await app.close();
    process.exit(0);
  });
}

bootstrap().catch((error) => {
  console.error('Error starting application:', error);
  process.exit(1);
});
