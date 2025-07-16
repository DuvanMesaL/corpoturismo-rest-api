import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import type { Document } from 'mongoose';

export type LogDocument = Log & Document;

@Schema({ timestamps: true })
export class Log {
  @Prop({ required: true })
  action: string;

  @Prop({ required: true })
  userId: number;

  @Prop()
  userEmail: string;

  @Prop()
  entityType: string;

  @Prop()
  entityId: string;

  @Prop({ type: Object })
  metadata: Record<string, any>;

  @Prop()
  ipAddress: string;

  @Prop()
  userAgent: string;

  @Prop({ default: 'info' })
  level: string;

  @Prop()
  message: string;
}

export const LogSchema = SchemaFactory.createForClass(Log);
