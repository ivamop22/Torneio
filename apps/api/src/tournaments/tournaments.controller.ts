import {
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  Post,
} from '@nestjs/common';
import { prisma } from '../lib/prisma';

@Controller('tournaments')
export class TournamentsController {
  @Get()
  async findAll() {
    return prisma.tournament.findMany({
      where: { deleted_at: null },
      orderBy: { createdAt: 'desc' },
    });
  }

  @Post()
  async create(@Body() body: any) {
    const slug = body.name.toLowerCase().replace(/\s+/g, '-') + '-' + Date.now();

    return prisma.tournament.create({
      data: {
        name: body.name,
        slug,
        level: 'recreational',
        status: 'draft',
        startDate: new Date(body.startDate),
        endDate: new Date(body.endDate),
        city: body.city,
        state: body.state,
        country: body.country ?? 'BR',
      },
    });
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    const existing = await prisma.tournament.findFirst({
      where: { id, deleted_at: null },
    });

    if (!existing) {
      throw new NotFoundException('Torneio não encontrado');
    }

    return prisma.tournament.update({
      where: { id },
      data: { deleted_at: new Date() },
    });
  }
}
