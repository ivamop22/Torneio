import {
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  Post,
  Request,
  Res,
} from '@nestjs/common';
import { Public, Roles } from '../auth/roles.decorator';
import { prisma } from '../lib/prisma';
import type { Response } from 'express';

const MODALITIES = [
  { gender: 'male', label: 'Masculino' },
  { gender: 'female', label: 'Feminino' },
  { gender: 'mixed', label: 'Mista' },
];
const AGE_GROUPS = ['Infantil', 'Junior', 'Adulto'];
const CLASS_LEVELS = ['A', 'B', 'C', 'D'];

@Controller('tournaments')
export class TournamentsController {
  @Public()
  @Get()
  async findAll(@Res({ passthrough: true }) res: Response) {
    // Tournament list is public — 60-second cache; stale-while-revalidate reduces visible latency
    res.setHeader('Cache-Control', 'public, max-age=60, stale-while-revalidate=120');
    return prisma.tournament.findMany({
      where: { deleted_at: null },
      orderBy: { createdAt: 'desc' },
    });
  }

  @Roles('admin', 'superuser')
  @Post()
  async create(@Body() body: any, @Request() req: any) {
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
        created_by: req.user?.userId ?? null,
      },
    });
  }

  @Post(':id/default-events')
  async createDefaultEvents(@Param('id') id: string) {
    const tournament = await prisma.tournament.findFirst({
      where: { id, deleted_at: null },
    });

    if (!tournament) {
      throw new NotFoundException('Torneio nao encontrado');
    }

    const createdOrExisting = [];

    for (const modality of MODALITIES) {
      for (const ageGroup of AGE_GROUPS) {
        for (const classLevel of CLASS_LEVELS) {
          const category = `${ageGroup} ${classLevel}`;
          const name = `${modality.label} ${category}`;

          const event =
            (await prisma.event.findFirst({
              where: {
                tournamentId: id,
                gender: modality.gender,
                category,
                deletedAt: null,
              },
            })) ??
            (await prisma.event.create({
              data: {
                tournamentId: id,
                name,
                gender: modality.gender,
                format: 'group_knockout',
                category,
                status: 'open',
              },
            }));

          createdOrExisting.push(event);
        }
      }
    }

    return {
      tournamentId: id,
      count: createdOrExisting.length,
      events: createdOrExisting,
    };
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    const existing = await prisma.tournament.findFirst({
      where: { id, deleted_at: null },
    });

    if (!existing) {
      throw new NotFoundException('Torneio nao encontrado');
    }

    const events = await prisma.event.findMany({
      where: { tournamentId: id },
      select: { id: true },
    });

    const eventIds = events.map((e) => e.id);

    await prisma.$transaction([
      prisma.matchSet.deleteMany({
        where: { match: { eventId: { in: eventIds } } },
      }),
      prisma.match.deleteMany({
        where: { eventId: { in: eventIds } },
      }),
      prisma.eventGroupStanding.deleteMany({
        where: { eventGroup: { eventId: { in: eventIds } } },
      }),
      prisma.eventGroup.deleteMany({
        where: { eventId: { in: eventIds } },
      }),
      prisma.draw.deleteMany({
        where: { eventId: { in: eventIds } },
      }),
      prisma.registration.deleteMany({
        where: { eventId: { in: eventIds } },
      }),
      prisma.ranking.deleteMany({
        where: { eventId: { in: eventIds } },
      }),
      prisma.team.deleteMany({
        where: { eventId: { in: eventIds } },
      }),
      prisma.event.deleteMany({
        where: { tournamentId: id },
      }),
      prisma.tournament.delete({
        where: { id },
      }),
    ]);

    return { deleted: true, id };
  }
}
