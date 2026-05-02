import { BadRequestException, Body, Controller, Delete, Get, NotFoundException, Param, Patch, Post, Query, Request } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { Roles } from '../auth/roles.decorator';

const prisma = new PrismaClient();

@Controller('events')
export class EventsController {
  @Get()
  async findAll(@Query('tournamentId') tournamentId?: string) {
    return prisma.event.findMany({
      where: {
        ...(tournamentId ? { tournamentId } : {}),
        deletedAt: null,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  @Post()
  async create(@Body() body: any) {
    return prisma.event.create({
      data: {
        tournamentId: body.tournamentId,
        name: body.name,
        gender: body.gender,
        format: body.format,
        category: body.category ?? null,
        maxPairs: body.maxPairs ?? null,
      },
    });
  }

  @Roles('admin', 'superuser')
  @Delete(':id')
  async remove(@Param('id') id: string) {
    const event = await prisma.event.findUnique({ where: { id } });
    if (!event) throw new NotFoundException('Evento não encontrado');
    await prisma.event.update({ where: { id }, data: { deletedAt: new Date() } });
    return { success: true };
  }

  @Roles('admin', 'superuser')
  @Post(':eventId/registration-link')
  async createRegistrationLink(
    @Param('eventId') eventId: string,
    @Body() body: { expiresInDays?: number; maxUses?: number },
    @Request() req: any,
  ) {
    const event = await prisma.event.findUnique({ where: { id: eventId } });
    if (!event) throw new NotFoundException('Evento não encontrado');

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + (body.expiresInDays ?? 30));

    const link = await prisma.registrationLink.create({
      data: {
        type: 'player_registration',
        eventId,
        adminId: req.user?.userId ?? '00000000-0000-0000-0000-000000000000',
        expiresAt,
        maxUses: body.maxUses ?? 100,
      },
    });
    return { token: link.token, expiresAt: link.expiresAt, maxUses: link.maxUses };
  }

  @Roles('admin', 'superuser')
  @Get(':eventId/registrations')
  async listRegistrations(@Param('eventId') eventId: string) {
    return prisma.registration.findMany({
      where: { eventId },
      orderBy: { createdAt: 'desc' },
    });
  }

  @Roles('admin', 'superuser')
  @Patch('registrations/:id/approve')
  async approveRegistration(@Param('id') id: string) {
    const reg = await prisma.registration.findUnique({ where: { id } });
    if (!reg) throw new NotFoundException('Inscrição não encontrada');
    if (reg.status !== 'pending') throw new BadRequestException('Inscrição não está pendente');
    return prisma.registration.update({
      where: { id },
      data: { status: 'accepted', acceptedAt: new Date() },
    });
  }
}
