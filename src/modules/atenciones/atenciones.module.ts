import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Atencion } from './entities/atencion.entity';
import { AtencionesService } from './atenciones.service';
import { AtencionesController } from './atenciones.controller';
import { RecaladasModule } from '../recaladas/recaladas.module';
import { UsersModule } from '../users/users.module';
import { LogsModule } from '../logs/logs.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Atencion]),
    RecaladasModule,
    UsersModule,
    LogsModule,
  ],
  controllers: [AtencionesController],
  providers: [AtencionesService],
  exports: [AtencionesService],
})
export class AtencionesModule {}
