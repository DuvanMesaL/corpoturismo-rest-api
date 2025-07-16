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
import type { RecaladasService } from './recaladas.service';
import type { CreateRecaladaDto } from './dto/create-recalada.dto';
import type { UpdateRecaladaDto } from './dto/update-recalada.dto';
import type { ChangeStatusRecaladaDto } from './dto/change-status-recalada.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { EstadoRecalada, TipoOperacion } from './entities/recalada.entity';

@Controller('recaladas')
@UseGuards(JwtAuthGuard, RolesGuard)
export class RecaladasController {
  constructor(private readonly recaladasService: RecaladasService) {}

  @Post()
  create(createRecaladaDto: CreateRecaladaDto, @CurrentUser() user: any) {
    return this.recaladasService.create(createRecaladaDto, user.id);
  }

  @Get()
  findAll(
    @Query('estado') estado?: EstadoRecalada,
    @Query('buqueId') buqueId?: number,
    @Query('muelle') muelle?: string,
    @Query('fechaDesde') fechaDesde?: string,
    @Query('fechaHasta') fechaHasta?: string,
    @Query('tipoOperacion') tipoOperacion?: TipoOperacion,
  ) {
    const filters: any = {};
    if (estado) filters.estado = estado;
    if (buqueId) filters.buqueId = +buqueId;
    if (muelle) filters.muelle = muelle;
    if (tipoOperacion) filters.tipoOperacion = tipoOperacion;
    if (fechaDesde) filters.fechaDesde = new Date(fechaDesde);
    if (fechaHasta) filters.fechaHasta = new Date(fechaHasta);

    return this.recaladasService.findAll(filters);
  }

  @Get('activas')
  findActive() {
    return this.recaladasService.findActive();
  }

  @Get('estadisticas')
  getEstadisticas() {
    return this.recaladasService.getEstadisticas();
  }

  @Get('muelle/:muelle')
  findByMuelle(@Param('muelle') muelle: string) {
    return this.recaladasService.findByMuelle(muelle);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.recaladasService.findOne(+id);
  }

  @Get('codigo/:codigo')
  findByCode(@Param('codigo') codigo: string) {
    return this.recaladasService.findByCode(codigo);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateRecaladaDto: UpdateRecaladaDto,
    @CurrentUser() user: any,
  ) {
    return this.recaladasService.update(+id, updateRecaladaDto, user.id);
  }

  @Patch(':id/estado')
  changeStatus(
    @Param('id') id: string,
    @Body() changeStatusDto: ChangeStatusRecaladaDto,
    @CurrentUser() user: any,
  ) {
    return this.recaladasService.changeStatus(+id, changeStatusDto, user.id);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() user: any) {
    return this.recaladasService.remove(+id, user.id);
  }
}
