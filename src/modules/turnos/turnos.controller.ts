import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import type { TurnosService } from './turnos.service';
import type { CreateTurnoDto } from './dto/create-turno.dto';
import type { TomarTurnoDto } from './dto/tomar-turno.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { EstadoTurno, TipoTurno } from './entities/turno.entity';

@Controller('turnos')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TurnosController {
  constructor(private readonly turnosService: TurnosService) {}

  @Post()
  @Roles('super_admin', 'admin', 'supervisor', 'guia')
  create(createTurnoDto: CreateTurnoDto, @CurrentUser() user: any) {
    return this.turnosService.create(createTurnoDto, user.id);
  }

  @Get()
  findAll(
    @Query('estado') estado?: EstadoTurno,
    @Query('tipo') tipo?: TipoTurno,
    @Query('atencionId') atencionId?: number,
    @Query('usuarioId') usuarioId?: number,
    @Query('fecha') fecha?: string,
  ) {
    const filters: any = {};
    if (estado) filters.estado = estado;
    if (tipo) filters.tipo = tipo;
    if (atencionId) filters.atencionId = +atencionId;
    if (usuarioId) filters.usuarioId = +usuarioId;
    if (fecha) filters.fecha = new Date(fecha);

    return this.turnosService.findAll(filters);
  }

  @Get('mis-turnos')
  @Roles('guia', 'supervisor', 'admin')
  findMyTurnos(@CurrentUser() user: any) {
    return this.turnosService.findAll({ usuarioId: user.id });
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.turnosService.findOne(+id);
  }

  @Post(':id/tomar')
  @Roles('guia', 'supervisor')
  tomarTurno(
    @Param('id') id: string,
    tomarTurnoDto: TomarTurnoDto,
    @CurrentUser() user: any,
  ) {
    return this.turnosService.tomarTurno(+id, user.id, tomarTurnoDto);
  }

  @Patch(':id/usar')
  @Roles('guia', 'supervisor')
  usarTurno(@Param('id') id: string, @CurrentUser() user: any) {
    return this.turnosService.usarTurno(+id, user.id);
  }

  @Patch(':id/completar')
  @Roles('guia', 'supervisor')
  completarTurno(
    @Param('id') id: string,
    @Body('notas') notas: string,
    @CurrentUser() user: any,
  ) {
    return this.turnosService.completarTurno(+id, user.id, notas);
  }

  @Patch(':id/liberar')
  @Roles('guia', 'supervisor')
  liberarTurno(
    @Param('id') id: string,
    @Body('motivo') motivo: string,
    @CurrentUser() user: any,
  ) {
    return this.turnosService.liberarTurno(+id, user.id, motivo);
  }

  @Patch(':id/cancelar')
  @Roles('super_admin', 'admin', 'supervisor')
  cancelarTurno(
    @Param('id') id: string,
    @Body('motivo') motivo: string,
    @CurrentUser() user: any,
  ) {
    return this.turnosService.cancelarTurno(+id, user.id, motivo);
  }
}
