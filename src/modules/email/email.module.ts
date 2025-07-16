import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EmailService } from './email.service';
import { LogsModule } from '../logs/logs.module';

@Module({
  imports: [ConfigModule, LogsModule],
  providers: [EmailService],
  exports: [EmailService],
})
export class EmailModule {}
