import { z } from 'zod';

const createTurnoSchema = z.object({
  recaladaId: z.string().min(1, 'ID de recalada es requerido'),
  fechaInicio: z.string().transform((str) => new Date(str)),
  fechaFin: z.string().transform((str) => new Date(str)),
  observaciones: z.string().optional()
}).refine((data) => data.fechaInicio < data.fechaFin, {
  message: "La fecha de inicio debe ser anterior a la fecha de fin",
  path: ["fechaFin"]
});

const usarTurnoSchema = z.object({
  observaciones: z.string().optional()
});

const terminarTurnoSchema = z.object({
  horasTrabajadas: z.number().positive().optional(),
  observaciones: z.string().optional()
});

const cancelarTurnoSchema = z.object({
  motivo: z.string().min(1, 'Motivo de cancelación es requerido')
});

export function validateCreateTurno(data: any) {
  try {
    const validData = createTurnoSchema.parse(data);
    return { success: true, data: validData, errors: null };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { 
        success: false, 
        data: null, 
        errors: error.errors.map(e => ({
          field: e.path.join('.'),
          message: e.message
        }))
      };
    }
    return { success: false, data: null, errors: [{ field: 'unknown', message: 'Error de validación' }] };
  }
}

export function validateUsarTurno(data: any) {
  try {
    const validData = usarTurnoSchema.parse(data);
    return { success: true, data: validData, errors: null };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { 
        success: false, 
        data: null, 
        errors: error.errors.map(e => ({
          field: e.path.join('.'),
          message: e.message
        }))
      };
    }
    return { success: false, data: null, errors: [{ field: 'unknown', message: 'Error de validación' }] };
  }
}

export function validateTerminarTurno(data: any) {
  try {
    const validData = terminarTurnoSchema.parse(data);
    return { success: true, data: validData, errors: null };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { 
        success: false, 
        data: null, 
        errors: error.errors.map(e => ({
          field: e.path.join('.'),
          message: e.message
        }))
      };
    }
    return { success: false, data: null, errors: [{ field: 'unknown', message: 'Error de validación' }] };
  }
}

export function validateCancelarTurno(data: any) {
  try {
    const validData = cancelarTurnoSchema.parse(data);
    return { success: true, data: validData, errors: null };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { 
        success: false, 
        data: null, 
        errors: error.errors.map(e => ({
          field: e.path.join('.'),
          message: e.message
        }))
      };
    }
    return { success: false, data: null, errors: [{ field: 'unknown', message: 'Error de validación' }] };
  }
}
