import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type { Repository } from 'typeorm';
import { Buque, type EstadoBuque } from './entities/buque.entity';
import type { CreateBuqueDto } from './dto/create-buque.dto';
import type { UpdateBuqueDto } from './dto/update-buque.dto';
import type { LogsService } from '../logs/logs.service';

@Injectable()
export class BuquesService {
  constructor(
    @InjectRepository(Buque)
    private buqueRepository: Repository<Buque>,
    private logsService: LogsService,
  ) {}

  async create(createBuqueDto: CreateBuqueDto, userId: number): Promise<Buque> {
    // Verificar si el código ya existe
    const existingBuque = await this.buqueRepository.findOne({
      where: { codigo: createBuqueDto.codigo },
    });

    if (existingBuque) {
      throw new ConflictException(
        `Ya existe un buque con el código ${createBuqueDto.codigo}`,
      );
    }

    const buque = this.buqueRepository.create(createBuqueDto);
    const savedBuque = await this.buqueRepository.save(buque);

    // Log de creación
    await this.logsService.createLog({
      action: 'BUQUE_CREATED',
      userId,
      entityType: 'Buque',
      entityId: savedBuque.id.toString(),
      message: `Buque ${savedBuque.nombre} (${savedBuque.codigo}) creado`,
      metadata: { buqueData: createBuqueDto },
    });

    return savedBuque;
  }

  async findAll(filters?: {
    estado?: EstadoBuque;
    tipo?: string;
    search?: string;
  }): Promise<Buque[]> {
    const query = this.buqueRepository.createQueryBuilder('buque');

    if (filters?.estado) {
      query.andWhere('buque.estado = :estado', { estado: filters.estado });
    }

    if (filters?.tipo) {
      query.andWhere('buque.tipo = :tipo', { tipo: filters.tipo });
    }

    if (filters?.search) {
      query.andWhere(
        '(buque.nombre ILIKE :search OR buque.codigo ILIKE :search OR buque.imo ILIKE :search)',
        {
          search: `%${filters.search}%`,
        },
      );
    }

    return await query.orderBy('buque.nombre', 'ASC').getMany();
  }

  async findOne(id: number): Promise<Buque> {
    const buque = await this.buqueRepository.findOne({
      where: { id },
      relations: ['recaladas'],
    });

    if (!buque) {
      throw new NotFoundException(`Buque con ID ${id} no encontrado`);
    }

    return buque;
  }

  async findByCode(codigo: string): Promise<Buque> {
    const buque = await this.buqueRepository.findOne({
      where: { codigo },
      relations: ['recaladas'],
    });

    if (!buque) {
      throw new NotFoundException(`Buque con código ${codigo} no encontrado`);
    }

    return buque;
  }

  async update(
    id: number,
    updateBuqueDto: UpdateBuqueDto,
    userId: number,
  ): Promise<Buque> {
    const buque = await this.findOne(id);

    // Si se está cambiando el código, verificar que no exista
    if (updateBuqueDto.codigo && updateBuqueDto.codigo !== buque.codigo) {
      const existingBuque = await this.buqueRepository.findOne({
        where: { codigo: updateBuqueDto.codigo },
      });

      if (existingBuque) {
        throw new ConflictException(
          `Ya existe un buque con el código ${updateBuqueDto.codigo}`,
        );
      }
    }

    const previousData = { ...buque };
    Object.assign(buque, updateBuqueDto);
    const updatedBuque = await this.buqueRepository.save(buque);

    // Log de actualización
    await this.logsService.createLog({
      action: 'BUQUE_UPDATED',
      userId,
      entityType: 'Buque',
      entityId: updatedBuque.id.toString(),
      message: `Buque ${updatedBuque.nombre} (${updatedBuque.codigo}) actualizado`,
      metadata: {
        previousData,
        newData: updateBuqueDto,
      },
    });

    return updatedBuque;
  }

  async remove(id: number, userId: number): Promise<void> {
    const buque = await this.findOne(id);

    // Verificar si tiene recaladas activas
    const activeRecaladas = await this.buqueRepository
      .createQueryBuilder('buque')
      .leftJoin('buque.recaladas', 'recalada')
      .where('buque.id = :id', { id })
      .andWhere('recalada.estado IN (:...estados)', {
        estados: ['programada', 'en_transito', 'atracada', 'en_operacion'],
      })
      .getCount();

    if (activeRecaladas > 0) {
      throw new ConflictException(
        'No se puede eliminar un buque con recaladas activas',
      );
    }

    await this.buqueRepository.softDelete(id);

    // Log de eliminación
    await this.logsService.createLog({
      action: 'BUQUE_DELETED',
      userId,
      entityType: 'Buque',
      entityId: buque.id.toString(),
      message: `Buque ${buque.nombre} (${buque.codigo}) eliminado`,
    });
  }

  async changeStatus(
    id: number,
    estado: EstadoBuque,
    userId: number,
  ): Promise<Buque> {
    const buque = await this.findOne(id);
    const previousStatus = buque.estado;

    buque.estado = estado;
    const updatedBuque = await this.buqueRepository.save(buque);

    // Log de cambio de estado
    await this.logsService.createLog({
      action: 'BUQUE_STATUS_CHANGED',
      userId,
      entityType: 'Buque',
      entityId: updatedBuque.id.toString(),
      message: `Estado del buque ${updatedBuque.nombre} cambiado de ${previousStatus} a ${estado}`,
      metadata: {
        previousStatus,
        newStatus: estado,
      },
    });

    return updatedBuque;
  }
}
