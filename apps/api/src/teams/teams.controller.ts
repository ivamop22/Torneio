import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { prisma } from '../lib/prisma';

@Controller('teams')
export class TeamsController {
  @Get()
  async findAll(@Query('eventId') eventId?: string) {
    const teams = await prisma.team.findMany({
      where: eventId ? { eventId } : undefined,
      orderBy: { createdAt: 'desc' },
    });

    const playerIds = Array.from(
      new Set(
        teams.flatMap((team) => [team.player1Id, team.player2Id].filter(Boolean)),
      ),
    );

    const players = await prisma.player.findMany({
      where: { id: { in: playerIds as string[] } },
    });

    return teams.map((team) => ({
      ...team,
      player1: players.find((p) => p.id === team.player1Id) ?? null,
      player2: players.find((p) => p.id === team.player2Id) ?? null,
    }));
  }

  @Post()
  async create(
    @Body()
    body: {
      eventId: string;
      player1Id: string;
      player2Id: string;
      seed?: number;
      wildCard?: boolean;
    },
  ) {
    if (body.player1Id === body.player2Id) {
      throw new Error('Jogadores devem ser diferentes');
    }

    return prisma.team.create({
      data: {
        eventId: body.eventId,
        player1Id: body.player1Id,
        player2Id: body.player2Id,
        seed: body.seed ?? null,
        wildCard: body.wildCard ?? false,
        alternate: false,
        waitList: false,
        status: 'accepted' as any,
      },
    });
  }
}
