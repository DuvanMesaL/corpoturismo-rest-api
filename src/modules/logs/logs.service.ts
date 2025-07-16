import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Log, type LogDocument } from './schemas/log.schema';
import type { CreateLogDto } from './dto/create-log.dto';
import type { Model } from 'mongoose';

@Injectable()
export class LogsService {
  constructor(
    @InjectModel(Log.name)
    private logModel: Model<LogDocument>,
  ) {}

  async createLog(createLogDto: CreateLogDto): Promise<Log> {
    const log = new this.logModel(createLogDto);
    return await log.save();
  }

  async findAll(
    page = 1,
    limit = 50,
    filters: any = {},
  ): Promise<{ logs: Log[]; total: number; pages: number }> {
    const skip = (page - 1) * limit;

    const [logs, total] = await Promise.all([
      this.logModel
        .find(filters)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.logModel.countDocuments(filters),
    ]);

    return {
      logs,
      total,
      pages: Math.ceil(total / limit),
    };
  }

  async findByUser(
    userId: number,
    page = 1,
    limit = 20,
  ): Promise<{ logs: Log[]; total: number; pages: number }> {
    return this.findAll(page, limit, { userId });
  }

  async findByAction(
    action: string,
    page = 1,
    limit = 20,
  ): Promise<{ logs: Log[]; total: number; pages: number }> {
    return this.findAll(page, limit, { action });
  }

  async findByDateRange(
    startDate: Date,
    endDate: Date,
    page = 1,
    limit = 20,
  ): Promise<{ logs: Log[]; total: number; pages: number }> {
    return this.findAll(page, limit, {
      createdAt: {
        $gte: startDate,
        $lte: endDate,
      },
    });
  }
}
