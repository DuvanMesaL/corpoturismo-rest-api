import {
  Injectable,
  PipeTransform,
  ArgumentMetadata,
  BadRequestException,
} from '@nestjs/common';
import { validate, ValidationError, ValidatorOptions } from 'class-validator';
import { plainToInstance, ClassConstructor } from 'class-transformer';

@Injectable()
export class CustomValidationPipe implements PipeTransform {
  async transform(
    value: unknown,
    metadata: ArgumentMetadata,
  ): Promise<unknown> {
    const { metatype } = metadata;

    if (!this.isClassConstructor(metatype) || !this.isPlainObject(value)) {
      return value;
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call
    const dto = plainToInstance(metatype, value);

    const errors: ValidationError[] = await validate(dto, {
      whitelist: true,
      forbidNonWhitelisted: true,
    } as ValidatorOptions);

    if (errors.length > 0) {
      const detailed: Record<string, string[]> = {};
      for (const err of errors) {
        if (err.constraints) {
          detailed[err.property] = Object.values(err.constraints);
        }
      }
      throw new BadRequestException({
        message: 'Errores de validación',
        errors: detailed,
        dto: metatype.name,
      });
    }

    return dto;
  }

  private isClassConstructor(
    metatype: unknown,
  ): metatype is ClassConstructor<Record<string, unknown>> {
    const primitives = [String, Boolean, Number, Array, Object] as const;
    return (
      typeof metatype === 'function' && !primitives.includes(metatype as any)
    );
  }

  private isPlainObject(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null;
  }
}
