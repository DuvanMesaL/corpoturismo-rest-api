import { PartialType } from '@nestjs/mapped-types';
import { CreateRecaladaDto } from './create-recalada.dto';

export class UpdateRecaladaDto extends PartialType(CreateRecaladaDto) {}
