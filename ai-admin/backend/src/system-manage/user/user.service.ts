import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateUserDto, UpdateUserDto, UserSearchDto } from './user.dto';
import { AppLoggerService } from '../../common/logger/app-logger.service';

@Injectable()
export class UserService {
  private readonly log = new AppLoggerService('UserService');

  constructor(private prisma: PrismaService) {}

  async getList(dto: UserSearchDto) {
    this.log.debug('getList', dto);
    const { current = 1, size = 10, status, userName, nickName, userPhone, userEmail } = dto;
    const skip = (current - 1) * size;

    const where: any = {};
    if (userName) where.username = { contains: userName };
    if (nickName) where.realName = { contains: nickName };
    if (userPhone) where.phone = { contains: userPhone };
    if (userEmail) where.email = { contains: userEmail };
    if (status) where.status = status === '1' ? 1 : 2;

    const [total, list] = await Promise.all([
      this.prisma.user.count({ where }),
      this.prisma.user.findMany({
        where,
        skip,
        take: size,
        include: { userRoles: { include: { role: true } } },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    const records = list.map((u) => ({
      id: u.id,
      userName: u.username,
      nickName: u.realName,
      userGender: null,
      userPhone: u.phone,
      userEmail: u.email,
      userRoles: u.userRoles.map((ur) => ur.role.code),
      status: u.status === 1 ? '1' : '2',
      createTime: u.createdAt.toISOString(),
      updateTime: u.updatedAt.toISOString(),
      createBy: '',
      updateBy: '',
    }));

    return { current, size, total, records };
  }

  async create(dto: CreateUserDto) {
    const exists = await this.prisma.user.findUnique({ where: { username: dto.userName } });
    if (exists) {
      this.log.warn('create user failed - username exists', { userName: dto.userName });
      throw new ConflictException('用户名已存在');
    }

    const hashed = await bcrypt.hash(dto.password, 10);
    const roles = dto.userRoles ?? [];
    const roleRecords = roles.length
      ? await this.prisma.role.findMany({ where: { code: { in: roles } } })
      : [];

    const user = await this.prisma.user.create({
      data: {
        username: dto.userName,
        password: hashed,
        realName: dto.nickName,
        phone: dto.userPhone,
        email: dto.userEmail,
        status: dto.status === '2' ? 2 : 1,
        userRoles: { create: roleRecords.map((r) => ({ roleId: r.id })) },
      },
    });
    this.log.info('create user success', { id: user.id, userName: dto.userName });
    return null;
  }

  async update(id: string, dto: UpdateUserDto) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      this.log.warn('update user failed - not found', { id });
      throw new NotFoundException('用户不存在');
    }

    const roles = dto.userRoles ?? [];
    const roleRecords = roles.length
      ? await this.prisma.role.findMany({ where: { code: { in: roles } } })
      : [];

    await this.prisma.$transaction([
      this.prisma.userRole.deleteMany({ where: { userId: id } }),
      this.prisma.user.update({
        where: { id },
        data: {
          realName: dto.nickName,
          phone: dto.userPhone,
          email: dto.userEmail,
          status: dto.status === '2' ? 2 : 1,
          userRoles: { create: roleRecords.map((r) => ({ roleId: r.id })) },
        },
      }),
    ]);
    this.log.info('update user success', { id });
    return null;
  }

  async remove(id: string) {
    await this.prisma.userRole.deleteMany({ where: { userId: id } });
    await this.prisma.user.delete({ where: { id } });
    this.log.info('remove user success', { id });
    return null;
  }
}
