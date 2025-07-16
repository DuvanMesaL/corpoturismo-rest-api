import { PartialType } from '@nestjs/mapped-types';
import { CreateBuqueDto } from './create-buque.dto';

export class UpdateBuqueDto extends PartialType(CreateBuqueDto) {}
