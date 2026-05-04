import {
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  Post,
  Put,
  HttpCode,
} from '@nestjs/common';
import { prisma } from '../lib/prisma';

@Controller('players')
export class PlayersController {
  @Get()
  async findAll() {
    return prisma.player.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: 'desc' },
    });
  }

  @Get(':id/performance')
  async performance(@Param('id') id: string) {
    const player = await prisma.player.findFirst({
      where: { id, deletedAt: null },
    });

    if (!player) {
      throw new NotFoundException('Jogador nao encontrado');
    }

    const teams = await prisma.team.findMany({
      where: {
        deletedAt: null,
        OR: [{ player1Id: id }, { player2Id: id }],
      },
      include: {
        event: true,
        player1: true,
        player2: true,
      },
    });

    const teamIds = teams.map((team) => team.id);
    const matches = teamIds.length
      ? await prisma.match.findMany({
          where: {
            OR: [{ team1Id: { in: teamIds } }, { team2Id: { in: teamIds } }],
          },
          include: {
            sets: true,
            team1: { include: { player1: true, player2: true } },
            team2: { include: { player1: true, player2: true } },
          },
          orderBy: { createdAt: 'desc' },
        })
      : [];

    const completed = matches.filter((match) => match.status === 'completed');
    const wins = completed.filter((match) => match.winnerTeamId && teamIds.includes(match.winnerTeamId)).length;
    const losses = completed.length - wins;

    let setsFor = 0;
    let setsAgainst = 0;
    let gamesFor = 0;
    let gamesAgainst = 0;

    for (const match of completed) {
      const playerIsTeam1 = match.team1Id ? teamIds.includes(match.team1Id) : false;

      for (const set of match.sets) {
        const ownGames = playerIsTeam1 ? set.team1Games : set.team2Games;
        const opponentGames = playerIsTeam1 ? set.team2Games : set.team1Games;

        gamesFor += ownGames;
        gamesAgainst += opponentGames;

        if (ownGames > opponentGames) setsFor++;
        else if (opponentGames > ownGames) setsAgainst++;
      }
    }

    return {
      player,
      summary: {
        teams: teams.length,
        matches: matches.length,
        completed: completed.length,
        wins,
        losses,
        winRate: completed.length ? Math.round((wins / completed.length) * 100) : 0,
        setsFor,
        setsAgainst,
        gamesFor,
        gamesAgainst,
        rankingPoints: player.rankingPoints,
      },
      teams: teams.map((team) => ({
        id: team.id,
        eventId: team.eventId,
        eventName: team.event.name,
        category: team.event.category,
        modality: team.event.gender,
        partner:
          team.player1Id === id
            ? team.player2?.fullName ?? null
            : team.player1?.fullName ?? null,
        status: team.status,
      })),
      recentMatches: matches.slice(0, 20).map((match) => ({
        id: match.id,
        eventId: match.eventId,
        roundName: match.roundName,
        status: match.status,
        winnerTeamId: match.winnerTeamId,
        isWin: Boolean(match.winnerTeamId && teamIds.includes(match.winnerTeamId)),
        team1: match.team1
          ? `${match.team1.player1.fullName}${match.team1.player2 ? ` / ${match.team1.player2.fullName}` : ''}`
          : 'A definir',
        team2: match.team2
          ? `${match.team2.player1.fullName}${match.team2.player2 ? ` / ${match.team2.player2.fullName}` : ''}`
          : 'A definir',
        sets: match.sets,
      })),
    };
  }

  @Post()
  async create(
    @Body()
    body: {
      fullName: string;
      gender?: string;
      email?: string;
      nationality?: string;
    },
  ) {
    return prisma.player.create({
      data: {
        fullName: body.fullName,
        gender: body.gender || null,
        email: body.email || null,
        nationality: body.nationality || null,
      },
    });
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body()
    body: {
      fullName?: string;
      gender?: string;
      email?: string;
      nationality?: string;
    },
  ) {
    const existing = await prisma.player.findFirst({
      where: { id, deletedAt: null },
    });
    if (!existing) {
      throw new NotFoundException('Jogador nao encontrado');
    }

    return prisma.player.update({
      where: { id },
      data: {
        fullName: body.fullName ?? existing.fullName,
        gender: body.gender ?? existing.gender,
        email: body.email ?? existing.email,
        nationality: body.nationality ?? existing.nationality,
      },
    });
  }

  @Delete('bulk')
  @HttpCode(200)
  async bulkDelete(@Body() body: { ids: string[] }) {
    const ids = Array.isArray(body?.ids) ? body.ids : [];
    if (ids.length === 0) return { deleted: 0, skipped: 0, skippedIds: [] };

    // 1) Fetch only active players from the requested set (1 query)
    const existingPlayers = await prisma.player.findMany({
      where: { id: { in: ids }, deletedAt: null },
      select: { id: true },
    });
    const existingIds = new Set(existingPlayers.map((p) => p.id));

    // 2) Find all teams that include any of these players (1 query)
    const teamsWithPlayers = await prisma.team.findMany({
      where: {
        OR: [
          { player1Id: { in: ids } },
          { player2Id: { in: ids } },
        ],
      },
      select: { id: true, player1Id: true, player2Id: true },
    });
    const teamIds = teamsWithPlayers.map((t) => t.id);

    // 3) Find which teams have active/completed matches (1 query)
    const blockedTeams = teamIds.length
      ? await prisma.match.findMany({
          where: {
            OR: [{ team1Id: { in: teamIds } }, { team2Id: { in: teamIds } }],
            status: { in: ['scheduled', 'live', 'completed'] },
          },
          select: { team1Id: true, team2Id: true },
        })
      : [];

    const blockedTeamIdSet = new Set<string>();
    for (const m of blockedTeams) {
      if (m.team1Id) blockedTeamIdSet.add(m.team1Id);
      if (m.team2Id) blockedTeamIdSet.add(m.team2Id);
    }

    // Map player -> their teams, to determine if the player is blocked
    const blockedPlayerIds = new Set<string>();
    for (const team of teamsWithPlayers) {
      if (blockedTeamIdSet.has(team.id)) {
        if (team.player1Id) blockedPlayerIds.add(team.player1Id);
        if (team.player2Id) blockedPlayerIds.add(team.player2Id);
      }
    }

    const skipped: string[] = [];
    const toDelete: string[] = [];

    for (const id of ids) {
      if (!existingIds.has(id)) continue;
      if (blockedPlayerIds.has(id)) { skipped.push(id); continue; }
      toDelete.push(id);
    }

    // 4) Soft-delete all eligible players in one query
    if (toDelete.length) {
      await prisma.player.updateMany({
        where: { id: { in: toDelete } },
        data: { deletedAt: new Date(), active: false },
      });
    }

    return { deleted: toDelete.length, skipped: skipped.length, skippedIds: skipped };
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    const existing = await prisma.player.findFirst({
      where: { id, deletedAt: null },
    });
    if (!existing) {
      throw new NotFoundException('Jogador nao encontrado');
    }

    return prisma.player.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        active: false,
      },
    });
  }
}
