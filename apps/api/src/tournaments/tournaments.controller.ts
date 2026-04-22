import { Body, Controller, Get, Post } from '@nestjs/common';
import { prisma } from '../lib/prisma';

@Controller('tournaments')
export class TournamentsController {
  @Get()
  async findAll() {
    return prisma.tournament.findMany({
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
}
