import { z } from 'zod';

const createRecaladaSchema = z.object({
  buqueId: z.string().min(1, 'ID de buque es requerido'),
  puertoOrigenId: z.string().optional(),
  puertoDestinoId: z.string().optional(),
  fechaLlegada: z.string().transform((str) => new Date(str)),
  fechaSalida: z.string().transform((str) => new Date(str)).optional(),
  numeroViaje: z.string().optional(),
  observaciones: z.string().optional()
}).refine((data) => {
  if (data.fechaSalida) {
    return data.fechaLlegada < data.fechaSalida;
  }
  return true;
}, {
  message: "La fecha de llegada debe ser anterior a la fecha de salida",
  path: ["fechaSalida"]
});

const updateRecaladaSchema = z.object({
  puertoOrigenId: z.string().optional(),
  puertoDestinoId: z.string().optional(),
  fechaLlegada: z.string().transform((str) => new Date(str)).optional(),
  fechaSalida: z.string().transform((str) => new Date(str)).optional(),
  numeroViaje: z.string().optional(),
  observaciones: z.string().optional(),
  estado: z.enum(['PROGRAMADA', 'EN_PUERTO', 'FINALIZADA', 'CANCELADA']).optional()
});

export function validateCreateRecalada(data: any) {
  try {
    const validData = createRecaladaSchema.parse(data);
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

export function validateUpdateRecalada(data: any) {
  try {
    const validData = updateRecaladaSchema.parse(data);
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
