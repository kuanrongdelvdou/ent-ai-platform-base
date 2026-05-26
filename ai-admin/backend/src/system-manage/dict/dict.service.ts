import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateDictTypeDto, UpdateDictTypeDto, CreateDictItemDto, UpdateDictItemDto } from './dict.dto';
import { AppLoggerService } from '../../common/logger/app-logger.service';

@Injectable()
export class DictService {
  private readonly log = new AppLoggerService('DictService');

  constructor(private prisma: PrismaService) {}

  async getTypeList() {
    this.log.debug('getTypeList');
    const list = await this.prisma.dictType.findMany({ orderBy: { createdAt: 'desc' } });
    return list.map((t) => ({
      id: t.id, name: t.name, code: t.code, remark: t.remark,
      status: t.status === 1 ? '1' : '2',
      createTime: t.createdAt.toISOString(), updateTime: t.updatedAt.toISOString(),
    }));
  }

  async createType(dto: CreateDictTypeDto) {
    const exists = await this.prisma.dictType.findUnique({ where: { code: dto.code } });
    if (exists) {
      this.log.warn('create dictType failed - code exists', { code: dto.code });
      throw new ConflictException('字典编码已存在');
    }
    const t = await this.prisma.dictType.create({
      data: { name: dto.name, code: dto.code, remark: dto.remark, status: dto.status === '2' ? 2 : 1 },
    });
    this.log.info('create dictType success', { id: t.id, code: dto.code });
    return null;
  }

  async updateType(id: string, dto: UpdateDictTypeDto) {
    const t = await this.prisma.dictType.findUnique({ where: { id } });
    if (!t) {
      this.log.warn('update dictType failed - not found', { id });
      throw new NotFoundException('字典类型不存在');
    }
    await this.prisma.dictType.update({
      where: { id },
      data: { name: dto.name, remark: dto.remark, status: dto.status === '2' ? 2 : 1 },
    });
    this.log.info('update dictType success', { id });
    return null;
  }

  async removeType(id: string) {
    await this.prisma.dictItem.deleteMany({ where: { dictTypeId: id } });
    await this.prisma.dictType.delete({ where: { id } });
    this.log.info('remove dictType success', { id });
    return null;
  }

  async getItemList(dictTypeId: string) {
    this.log.debug('getItemList', { dictTypeId });
    const list = await this.prisma.dictItem.findMany({
      where: { dictTypeId },
      orderBy: { sort: 'asc' },
    });
    return list.map((i) => ({
      id: i.id, dictTypeId: i.dictTypeId, label: i.label, value: i.value,
      sort: i.sort, remark: i.remark,
      status: i.status === 1 ? '1' : '2',
      createTime: i.createdAt.toISOString(), updateTime: i.updatedAt.toISOString(),
    }));
  }

  async createItem(dto: CreateDictItemDto) {
    const item = await this.prisma.dictItem.create({
      data: {
        dictTypeId: dto.dictTypeId, label: dto.label, value: dto.value,
        sort: dto.sort ?? 0, remark: dto.remark, status: dto.status === '2' ? 2 : 1,
      },
    });
    this.log.info('create dictItem success', { id: item.id });
    return null;
  }

  async updateItem(id: string, dto: UpdateDictItemDto) {
    const item = await this.prisma.dictItem.findUnique({ where: { id } });
    if (!item) {
      this.log.warn('update dictItem failed - not found', { id });
      throw new NotFoundException('字典数据不存在');
    }
    await this.prisma.dictItem.update({
      where: { id },
      data: { label: dto.label, value: dto.value, sort: dto.sort, remark: dto.remark, status: dto.status === '2' ? 2 : 1 },
    });
    this.log.info('update dictItem success', { id });
    return null;
  }

  async removeItem(id: string) {
    await this.prisma.dictItem.delete({ where: { id } });
    this.log.info('remove dictItem success', { id });
    return null;
  }
}
