import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
} from '@nestjs/common';
import type { BuquesService } from './buques.service';
import type { CreateBuqueDto } from './dto/create-buque.dto';
import type { UpdateBuqueDto } from './dto/update-buque.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { EstadoBuque } from './entities/buque.entity';

@Controller('buques')
@UseGuards(JwtAuthGuard, RolesGuard)
export class BuquesController {
  constructor(private readonly buquesService: BuquesService) {}

  @Post()
  @Roles('super_admin', 'admin', 'supervisor')
  create(createBuqueDto: CreateBuqueDto, @CurrentUser() user: any) {
    return this.buquesService.create(createBuqueDto, user.id);
  }

  @Get()
  findAll(
    @Query('estado') estado?: EstadoBuque,
    @Query('tipo') tipo?: string,
    @Query('search') search?: string,
  ) {
    return this.buquesService.findAll({ estado, tipo, search });
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.buquesService.findOne(+id);
  }

  @Get('codigo/:codigo')
  findByCode(@Param('codigo') codigo: string) {
    return this.buquesService.findByCode(codigo);
  }

  @Patch(':id')
  @Roles('super_admin', 'admin', 'supervisor')
  update(
    @Param('id') id: string,
    updateBuqueDto: UpdateBuqueDto,
    @CurrentUser() user: any,
  ) {
    return this.buquesService.update(+id, updateBuqueDto, user.id);
  }

  @Patch(':id/estado')
  @Roles('super_admin', 'admin', 'supervisor')
  changeStatus(
    @Param('id') id: string,
    @Body('estado') estado: EstadoBuque,
    @CurrentUser() user: any,
  ) {
    return this.buquesService.changeStatus(+id, estado, user.id);
  }

  @Delete(':id')
  @Roles('super_admin', 'admin')
  remove(@Param('id') id: string, @CurrentUser() user: any) {
    return this.buquesService.remove(+id, user.id);
  }
}
