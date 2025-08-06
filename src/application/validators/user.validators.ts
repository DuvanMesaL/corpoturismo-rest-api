import { z } from 'zod';

const createUserSchema = z.object({
  email: z.string()
    .email('Email inválido')
    .min(1, 'Email es requerido'),
  rolId: z.string()
    .min(1, 'Rol es requerido'),
  usuarioInvitadorId: z.string()
    .min(1, 'Usuario invitador es requerido')
});

const updateUserSchema = z.object({
  primerNombre: z.string().min(1, 'Primer nombre es requerido').optional(),
  segundoNombre: z.string().optional(),
  primerApellido: z.string().min(1, 'Primer apellido es requerido').optional(),
  segundoApellido: z.string().optional(),
  telefono: z.string().optional(),
  rolId: z.string().optional(),
  estado: z.enum(['activo', 'inactivo']).optional()
});

const completeRegistrationSchema = z.object({
  uuid: z.string().min(1, 'UUID es requerido'),
  tipoIdentificacion: z.string().min(1, 'Tipo de identificación es requerido'),
  numeroIdentificacion: z.string().min(1, 'Número de identificación es requerido'),
  primerNombre: z.string().min(1, 'Primer nombre es requerido'),
  segundoNombre: z.string().optional(),
  primerApellido: z.string().min(1, 'Primer apellido es requerido'),
  segundoApellido: z.string().optional(),
  telefono: z.string().min(1, 'Teléfono es requerido'),
  password: z.string()
    .min(8, 'La contraseña debe tener al menos 8 caracteres')
    .regex(/(?=.*[a-z])/, 'Debe contener al menos una letra minúscula')
    .regex(/(?=.*[A-Z])/, 'Debe contener al menos una letra mayúscula')
    .regex(/(?=.*\d)/, 'Debe contener al menos un número')
    .regex(/(?=.*[@$!%*?&])/, 'Debe contener al menos un carácter especial'),
  confirmPassword: z.string().min(1, 'Confirmación de contraseña es requerida')
}).refine((data) => data.password === data.confirmPassword, {
  message: "Las contraseñas no coinciden",
  path: ["confirmPassword"]
});

export function validateCreateUser(data: any) {
  try {
    const validData = createUserSchema.parse(data);
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

export function validateUpdateUser(data: any) {
  try {
    const validData = updateUserSchema.parse(data);
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

export function validateCompleteRegistration(data: any) {
  try {
    const validData = completeRegistrationSchema.parse(data);
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
