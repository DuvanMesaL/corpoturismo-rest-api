import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Buque } from './entities/buque.entity';
import { BuquesService } from './buques.service';
import { BuquesController } from './buques.controller';
import { LogsModule } from '../logs/logs.module';

@Module({
  imports: [TypeOrmModule.forFeature([Buque]), LogsModule],
  controllers: [BuquesController],
  providers: [BuquesService],
  exports: [BuquesService],
})
export class BuquesModule {}
