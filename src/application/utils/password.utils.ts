import { randomBytes } from 'crypto';

export function generateTempPassword(length: number = 12): string {
  const charset = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789@#$%&*';
  let password = '';
  
  // Asegurar al menos un carácter de cada tipo
  const uppercase = 'ABCDEFGHJKMNPQRSTUVWXYZ';
  const lowercase = 'abcdefghijkmnpqrstuvwxyz';
  const numbers = '23456789';
  const symbols = '@#$%&*';
  
  password += uppercase[Math.floor(Math.random() * uppercase.length)];
  password += lowercase[Math.floor(Math.random() * lowercase.length)];
  password += numbers[Math.floor(Math.random() * numbers.length)];
  password += symbols[Math.floor(Math.random() * symbols.length)];
  
  // Completar el resto de la contraseña
  for (let i = password.length; i < length; i++) {
    password += charset[Math.floor(Math.random() * charset.length)];
  }
  
  // Mezclar los caracteres
  return password.split('').sort(() => Math.random() - 0.5).join('');
}

export function validatePasswordStrength(password: string): {
  isValid: boolean;
  score: number;
  feedback: string[];
} {
  const feedback: string[] = [];
  let score = 0;

  // Longitud
  if (password.length >= 8) score += 1;
  else feedback.push('Debe tener al menos 8 caracteres');

  if (password.length >= 12) score += 1;

  // Complejidad
  if (/[a-z]/.test(password)) score += 1;
  else feedback.push('Debe contener letras minúsculas');

  if (/[A-Z]/.test(password)) score += 1;
  else feedback.push('Debe contener letras mayúsculas');

  if (/\d/.test(password)) score += 1;
  else feedback.push('Debe contener números');

  if (/[@$!%*?&]/.test(password)) score += 1;
  else feedback.push('Debe contener caracteres especiales (@$!%*?&)');

  // Patrones comunes
  if (!/(.)\1{2,}/.test(password)) score += 1;
  else feedback.push('Evita repetir el mismo carácter más de 2 veces');

  return {
    isValid: score >= 5,
    score,
    feedback
  };
}
