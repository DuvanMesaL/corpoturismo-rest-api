import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Recalada } from './entities/recalada.entity';
import { RecaladasService } from './recaladas.service';
import { RecaladasController } from './recaladas.controller';
import { BuquesModule } from '../buques/buques.module';
import { LogsModule } from '../logs/logs.module';

@Module({
  imports: [TypeOrmModule.forFeature([Recalada]), BuquesModule, LogsModule],
  controllers: [RecaladasController],
  providers: [RecaladasService],
  exports: [RecaladasService],
})
export class RecaladasModule {}
