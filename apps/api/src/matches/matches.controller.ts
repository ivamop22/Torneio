import { Body, Controller, Get, Param, Patch, Post, Query, Res } from '@nestjs/common';
import { DrawsService } from '../draws/draws.service';
import { Public } from '../auth/roles.decorator';
import { prisma } from '../lib/prisma';
import type { Response } from 'express';

@Controller('matches')
export class MatchesController {
  constructor(private readonly drawsService: DrawsService) {}

  @Public()
  @Get()
  async findAll(
    @Query('eventId') eventId?: string,
    @Query('groupId') groupId?: string,
    @Query('status') status?: string,
    @Res({ passthrough: true }) res?: Response,
  ) {
    // Live match data: 15-second cache so ao-vivo pollers share results across clients
    res?.setHeader('Cache-Control', 'public, max-age=15, stale-while-revalidate=30');
    return prisma.match.findMany({
      where: {
        ...(eventId ? { eventId } : {}),
        ...(groupId ? { groupId } : {}),
        ...(status ? { status } : {}),
      },
      include: {
        team1: { include: { player1: true, player2: true } },
        team2: { include: { player1: true, player2: true } },
        sets: { orderBy: { setNumber: 'asc' } },
      },
      orderBy: { matchNumber: 'asc' },
    });
  }

  @Public()
  @Get(':id')
  async findOne(@Param('id') id: string) {
    return prisma.match.findUnique({
      where: { id },
      include: {
        team1: { include: { player1: true, player2: true } },
        team2: { include: { player1: true, player2: true } },
        sets: { orderBy: { setNumber: 'asc' } },
      },
    });
  }

  // Registrar resultado + disparar motor de automação
  @Patch(':id/result')
  async setResult(
    @Param('id') id: string,
    @Body()
    body: {
      winnerTeamId: string;
      loserTeamId?: string;
      walkover?: boolean;
      sets?: Array<{
        setNumber: number;
        team1Games: number;
        team2Games: number;
        tieBreakTeam1?: number;
        tieBreakTeam2?: number;
        isMatchTiebreak?: boolean;
      }>;
    },
  ) {
    // Buscar partida atual
    const match = await prisma.match.findUniqueOrThrow({ where: { id } });
    const loserTeamId =
      body.loserTeamId ??
      (body.winnerTeamId === match.team1Id ? match.team2Id : match.team1Id);

    // Salvar resultado da partida
    const updated = await prisma.match.update({
      where: { id },
      data: {
        winnerTeamId: body.winnerTeamId,
        loserTeamId: loserTeamId ?? undefined,
        walkover: body.walkover ?? false,
        status: 'completed',
        finishedAt: new Date(),
      },
    });

    // Salvar sets (se informados) — deleteMany + createMany = 2 queries instead of 1 + N
    if (body.sets?.length) {
      await prisma.matchSet.deleteMany({ where: { matchId: id } });
      await prisma.matchSet.createMany({
        data: body.sets.map((set) => ({
          matchId: id,
          setNumber: set.setNumber,
          team1Games: set.team1Games,
          team2Games: set.team2Games,
          tieBreakTeam1: set.tieBreakTeam1 ?? null,
          tieBreakTeam2: set.tieBreakTeam2 ?? null,
          isMatchTiebreak: set.isMatchTiebreak ?? false,
        })),
      });
    }

    // 🤖 MOTOR: Auto-avançar vencedor
    await this.drawsService.autoAdvanceWinner(id);

    return {
      ...updated,
      automationTriggered: true,
      message: 'Resultado salvo. Motor de automação ativado.',
    };
  }

  // Iniciar partida
  @Patch(':id/start')
  async startMatch(@Param('id') id: string) {
    return prisma.match.update({
      where: { id },
      data: { status: 'live', startedAt: new Date() },
    });
  }

  // Cancelar/walkover
  @Patch(':id/walkover')
  async walkover(@Param('id') id: string, @Body() body: { winnerTeamId: string }) {
    const match = await prisma.match.findUniqueOrThrow({ where: { id } });
    const loserTeamId = body.winnerTeamId === match.team1Id ? match.team2Id : match.team1Id;

    const updated = await prisma.match.update({
      where: { id },
      data: {
        winnerTeamId: body.winnerTeamId,
        loserTeamId: loserTeamId ?? undefined,
        walkover: true,
        status: 'completed',
        finishedAt: new Date(),
      },
    });

    await this.drawsService.autoAdvanceWinner(id);
    return updated;
  }

  // Lançar placar ao vivo (set por set)
  @Post(':id/sets')
  async addSet(
    @Param('id') id: string,
    @Body()
    body: {
      setNumber: number;
      team1Games: number;
      team2Games: number;
      tieBreakTeam1?: number;
      tieBreakTeam2?: number;
      isMatchTiebreak?: boolean;
    },
  ) {
    return prisma.matchSet.upsert({
      where: { matchId_setNumber: { matchId: id, setNumber: body.setNumber } },
      update: {
        team1Games: body.team1Games,
        team2Games: body.team2Games,
        tieBreakTeam1: body.tieBreakTeam1 ?? null,
        tieBreakTeam2: body.tieBreakTeam2 ?? null,
        isMatchTiebreak: body.isMatchTiebreak ?? false,
      },
      create: {
        matchId: id,
        setNumber: body.setNumber,
        team1Games: body.team1Games,
        team2Games: body.team2Games,
        tieBreakTeam1: body.tieBreakTeam1 ?? null,
        tieBreakTeam2: body.tieBreakTeam2 ?? null,
        isMatchTiebreak: body.isMatchTiebreak ?? false,
      },
    });
  }
}
