import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
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

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body()
    body: {
      seed?: number | null;
      player1Id?: string;
      player2Id?: string;
    },
  ) {
    const existing = await prisma.team.findFirst({
      where: { id, deletedAt: null },
    });

    if (!existing) {
      throw new NotFoundException('Dupla nao encontrada');
    }

    const completedMatch = await prisma.match.findFirst({
      where: {
        status: 'completed',
        OR: [{ team1Id: id }, { team2Id: id }],
      },
    });

    if (completedMatch) {
      throw new BadRequestException(
        'Nao e possivel editar uma dupla que ja disputou partidas.',
      );
    }

    const newPlayer1Id = body.player1Id ?? existing.player1Id;
    const newPlayer2Id = body.player2Id ?? existing.player2Id;

    if (newPlayer1Id && newPlayer2Id && newPlayer1Id === newPlayer2Id) {
      throw new BadRequestException('Jogadores devem ser diferentes');
    }

    return prisma.team.update({
      where: { id },
      data: {
        seed: body.seed !== undefined ? body.seed : existing.seed,
        player1Id: newPlayer1Id ?? undefined,
        player2Id: newPlayer2Id ?? undefined,
      },
    });
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    const existing = await prisma.team.findFirst({
      where: { id, deletedAt: null },
    });

    if (!existing) {
      throw new NotFoundException('Dupla nao encontrada');
    }

    const completedMatch = await prisma.match.findFirst({
      where: {
        status: 'completed',
        OR: [{ team1Id: id }, { team2Id: id }],
      },
    });

    if (completedMatch) {
      throw new BadRequestException(
        'Nao e possivel excluir uma dupla que ja disputou partidas.',
      );
    }

    return prisma.team.delete({ where: { id } });
  }
}
