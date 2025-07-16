import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Turno } from './entities/turno.entity';
import { TurnosService } from './turnos.service';
import { TurnosController } from './turnos.controller';
import { LogsModule } from '../logs/logs.module';
import { AtencionesModule } from '../atenciones/atenciones.module';

@Module({
  imports: [TypeOrmModule.forFeature([Turno]), LogsModule, AtencionesModule],
  controllers: [TurnosController],
  providers: [TurnosService],
  exports: [TurnosService],
})
export class TurnosModule {}
