import mongoose from 'mongoose';
import { logger } from '../logging/winston-logger';

export async function connectMongoDB(): Promise<void> {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/corpoturismo-logs';
    
    await mongoose.connect(mongoUri);
    
    logger.info('✅ Conectado a MongoDB para logs');
  } catch (error) {
    logger.error('❌ Error conectando a MongoDB:', error);
    throw error;
  }
}

// Schema para logs de auditoría
const logSchema = new mongoose.Schema({
  timestamp: { type: Date, default: Date.now, index: true },
  usuario_id: { type: String, index: true },
  accion: { type: String, required: true, index: true },
  tipo: { 
    type: String, 
    enum: ['exito', 'error', 'advertencia'], 
    required: true,
    index: true 
  },
  entidad_afectada: { type: String, index: true },
  detalles: { type: mongoose.Schema.Types.Mixed },
  ip: { type: String, index: true },
  user_agent: String,
  endpoint: String,
  metodo_http: String,
  status_code: Number,
  mensaje: String,
  tiempo_respuesta_ms: Number,
  host_origen: String
}, {
  collection: 'audit_logs',
  timestamps: false
});

// Índices compuestos para consultas frecuentes
logSchema.index({ timestamp: -1, usuario_id: 1 });
logSchema.index({ accion: 1, timestamp: -1 });
logSchema.index({ entidad_afectada: 1, timestamp: -1 });
logSchema.index({ tipo: 1, timestamp: -1 });

export const AuditLog = mongoose.model('AuditLog', logSchema);
