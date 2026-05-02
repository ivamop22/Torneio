import {
  BadRequestException,
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Patch,
  Post,
  Request,
} from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';
import { Roles } from '../auth/roles.decorator';

const prisma = new PrismaClient();

@Roles('superuser')
@Controller('superuser')
export class SuperuserController {
  @Get('admins')
  async listAdmins() {
    return prisma.user.findMany({
      where: { role: 'admin', deletedAt: null },
      select: { id: true, name: true, email: true, status: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  @Post('admins')
  async createAdmin(@Body() body: { name: string; email: string; password: string }) {
    const existing = await prisma.user.findUnique({ where: { email: body.email } });
    if (existing) throw new BadRequestException('E-mail já cadastrado');
    const passwordHash = await bcrypt.hash(body.password, 10);
    const user = await prisma.user.create({
      data: { name: body.name, email: body.email, passwordHash, role: 'admin', status: 'active' },
      select: { id: true, name: true, email: true, status: true, createdAt: true },
    });
    // Assign orphan tournaments to this admin if they're the first
    await prisma.tournament.updateMany({
      where: { created_by: null },
      data: { created_by: user.id },
    });
    return user;
  }

  @Patch('admins/:id/toggle')
  async toggleAdmin(@Param('id') id: string) {
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user || user.role !== 'admin') throw new NotFoundException('Admin não encontrado');
    const newStatus = user.status === 'active' ? 'inactive' : 'active';
    return prisma.user.update({
      where: { id },
      data: { status: newStatus },
      select: { id: true, name: true, email: true, status: true },
    });
  }

  @Post('invite')
  async createInvite(@Body() body: { expiresInDays?: number }, @Request() req: any) {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + (body.expiresInDays ?? 7));

    const link = await prisma.registrationLink.create({
      data: {
        type: 'admin_invite',
        adminId: req.user.userId,
        expiresAt,
        maxUses: 1,
      },
    });
    return { token: link.token, expiresAt: link.expiresAt };
  }
}
