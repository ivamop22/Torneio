import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { prisma } from '../lib/prisma';

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
}
