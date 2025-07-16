import { PartialType } from '@nestjs/mapped-types';
import { CreateAtencionDto } from './create-atencion.dto';

export class UpdateAtencionDto extends PartialType(CreateAtencionDto) {}
