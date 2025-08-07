import { z } from 'zod';

const createBuqueSchema = z.object({
  nombre: z.string().min(1, 'Nombre del buque es requerido'),
  bandera: z.string().optional(),
  eslora: z.number().positive('La eslora debe ser un número positivo').optional(),
  manga: z.number().positive('La manga debe ser un número positivo').optional(),
  calado: z.number().positive('El calado debe ser un número positivo').optional(),
  tonelaje: z.number().positive('El tonelaje debe ser un número positivo').optional(),
  tipoEmbarcacion: z.string().optional()
});

const updateBuqueSchema = z.object({
  nombre: z.string().min(1, 'Nombre del buque es requerido').optional(),
  bandera: z.string().optional(),
  eslora: z.number().positive('La eslora debe ser un número positivo').optional(),
  manga: z.number().positive('La manga debe ser un número positivo').optional(),
  calado: z.number().positive('El calado debe ser un número positivo').optional(),
  tonelaje: z.number().positive('El tonelaje debe ser un número positivo').optional(),
  tipoEmbarcacion: z.string().optional()
});

export function validateCreateBuque(data: any) {
  try {
    const validData = createBuqueSchema.parse(data);
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

export function validateUpdateBuque(data: any) {
  try {
    const validData = updateBuqueSchema.parse(data);
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
