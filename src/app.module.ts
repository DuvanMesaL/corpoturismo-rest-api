import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MongooseModule } from '@nestjs/mongoose';
import { APP_GUARD, APP_INTERCEPTOR, APP_FILTER } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { DatabaseConfig } from './config/database.config';
import { validateEnvironment } from './config/env.validation';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { RolesModule } from './modules/roles/roles.module';
import { LogsModule } from './modules/logs/logs.module';
import { EmailModule } from './modules/email/email.module';
import { BuquesModule } from './modules/buques/buques.module';
import { RecaladasModule } from './modules/recaladas/recaladas.module';
import { AtencionesModule } from './modules/atenciones/atenciones.module';
import { TurnosModule } from './modules/turnos/turnos.module';
import { HealthModule } from './health/health.module';
import { JwtAuthGuard } from './modules/auth/guards/jwt-auth.guard';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

@Module({
  imports: [
    // Configuración de variables de entorno con validación
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      validate: validateEnvironment,
    }),

    // Rate limiting
    ThrottlerModule.forRoot([
      {
        ttl: 60000, // 1 minuto
        limit: 100, // 100 requests por minuto
      },
    ]),

    // Configuración de PostgreSQL con TypeORM
    TypeOrmModule.forRootAsync({
      useClass: DatabaseConfig,
    }),

    // Configuración de MongoDB para logs
    MongooseModule.forRoot(
      process.env.MONGODB_URI || 'mongodb://localhost:27017/turnos_logs',
    ),

    // Módulos de la aplicación
    AuthModule,
    UsersModule,
    RolesModule,
    LogsModule,
    EmailModule,
    BuquesModule,
    RecaladasModule,
    AtencionesModule,
    TurnosModule,
    HealthModule,
  ],
  providers: [
    // Rate limiting guard
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    // Guard JWT global
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    // Interceptor de logging global
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
    // Exception filter global
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },
  ],
})
export class AppModule {}
