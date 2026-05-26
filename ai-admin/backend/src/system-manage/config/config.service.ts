import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateConfigDto, UpdateConfigDto } from './config.dto';
import { AppLoggerService } from '../../common/logger/app-logger.service';

@Injectable()
export class SysConfigService {
  private readonly log = new AppLoggerService('SysConfigService');

  constructor(private prisma: PrismaService) {}

  async getList() {
    this.log.debug('getList');
    const list = await this.prisma.config.findMany({ orderBy: { createdAt: 'desc' } });
    return list.map((c) => ({
      id: c.id, key: c.key, value: c.value, remark: c.remark,
      createTime: c.createdAt.toISOString(), updateTime: c.updatedAt.toISOString(),
    }));
  }

  async create(dto: CreateConfigDto) {
    const exists = await this.prisma.config.findUnique({ where: { key: dto.key } });
    if (exists) {
      this.log.warn('create config failed - key exists', { key: dto.key });
      throw new ConflictException('配置键已存在');
    }
    const c = await this.prisma.config.create({
      data: { key: dto.key, value: dto.value, remark: dto.remark },
    });
    this.log.info('create config success', { id: c.id, key: dto.key });
    return null;
  }

  async update(id: string, dto: UpdateConfigDto) {
    const c = await this.prisma.config.findUnique({ where: { id } });
    if (!c) {
      this.log.warn('update config failed - not found', { id });
      throw new NotFoundException('配置不存在');
    }
    await this.prisma.config.update({
      where: { id },
      data: { value: dto.value, remark: dto.remark },
    });
    this.log.info('update config success', { id });
    return null;
  }

  async remove(id: string) {
    await this.prisma.config.delete({ where: { id } });
    this.log.info('remove config success', { id });
    return null;
  }
}
