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
import type { AtencionesService } from './atenciones.service';
import type { CreateAtencionDto } from './dto/create-atencion.dto';
import type { UpdateAtencionDto } from './dto/update-atencion.dto';
import type { ChangeStatusAtencionDto } from './dto/change-status-atencion.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type {
  EstadoAtencion,
  TipoAtencion,
  PrioridadAtencion,
} from './entities/atencion.entity';

@Controller('atenciones')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AtencionesController {
  constructor(private readonly atencionesService: AtencionesService) {}

  @Post()
  @Roles('super_admin', 'admin', 'supervisor')
  create(createAtencionDto: CreateAtencionDto, @CurrentUser() user: any) {
    return this.atencionesService.create(createAtencionDto, user.id);
  }

  @Get()
  findAll(
    @Query('estado') estado?: EstadoAtencion,
    @Query('tipo') tipo?: TipoAtencion,
    @Query('prioridad') prioridad?: PrioridadAtencion,
    @Query('recaladaId') recaladaId?: number,
    @Query('responsableId') responsableId?: number,
    @Query('fechaDesde') fechaDesde?: string,
    @Query('fechaHasta') fechaHasta?: string,
  ) {
    const filters: any = {};
    if (estado) filters.estado = estado;
    if (tipo) filters.tipo = tipo;
    if (prioridad) filters.prioridad = prioridad;
    if (recaladaId) filters.recaladaId = +recaladaId;
    if (responsableId) filters.responsableId = +responsableId;
    if (fechaDesde) filters.fechaDesde = new Date(fechaDesde);
    if (fechaHasta) filters.fechaHasta = new Date(fechaHasta);

    return this.atencionesService.findAll(filters);
  }

  @Get('pendientes')
  findPendientes() {
    return this.atencionesService.findPendientes();
  }

  @Get('mis-atenciones')
  @Roles('guia', 'supervisor', 'admin')
  findMyAtenciones(@CurrentUser() user: any) {
    return this.atencionesService.findByResponsable(user.id);
  }

  @Get('estadisticas')
  @Roles('super_admin', 'admin', 'supervisor')
  getEstadisticas() {
    return this.atencionesService.getEstadisticas();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.atencionesService.findOne(+id);
  }

  @Get('codigo/:codigo')
  findByCode(@Param('codigo') codigo: string) {
    return this.atencionesService.findByCode(codigo);
  }

  @Patch(':id')
  @Roles('super_admin', 'admin', 'supervisor')
  update(
    @Param('id') id: string,
    updateAtencionDto: UpdateAtencionDto,
    @CurrentUser() user: any,
  ) {
    return this.atencionesService.update(+id, updateAtencionDto, user.id);
  }

  @Patch(':id/estado')
  @Roles('super_admin', 'admin', 'supervisor', 'guia')
  changeStatus(
    @Param('id') id: string,
    changeStatusDto: ChangeStatusAtencionDto,
    @CurrentUser() user: any,
  ) {
    return this.atencionesService.changeStatus(+id, changeStatusDto, user.id);
  }

  @Patch(':id/asignar')
  @Roles('super_admin', 'admin', 'supervisor')
  assignResponsable(
    @Param('id') id: string,
    @Body('responsableId') responsableId: number,
    @CurrentUser() user: any,
  ) {
    return this.atencionesService.assignResponsable(
      +id,
      responsableId,
      user.id,
    );
  }

  @Delete(':id')
  @Roles('super_admin', 'admin')
  remove(@Param('id') id: string, @CurrentUser() user: any) {
    return this.atencionesService.remove(+id, user.id);
  }
}
