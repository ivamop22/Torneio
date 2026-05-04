import { Body, Controller, Delete, Get, Header, Param, Post, Put, Query, Res } from '@nestjs/common';
import { DrawsService } from './draws.service';
import { Public } from '../auth/roles.decorator';
import { prisma } from '../lib/prisma';
import type { Response } from 'express';

@Controller()
export class DrawsController {
  constructor(private readonly drawsService: DrawsService) {}

  @Post('draws/generate-group-knockout')
  async generate(@Body() body: { eventId: string; groupCount?: number }) {
    return this.drawsService.generateGroupKnockout(body.eventId, body.groupCount ?? 2);
  }

  @Post('tournaments/:tournamentId/draws/generate-all')
  async generateAllForTournament(@Param('tournamentId') tournamentId: string) {
    const events = await prisma.event.findMany({
      where: { tournamentId, deletedAt: null },
      orderBy: [{ gender: 'asc' }, { category: 'asc' }],
    });

    const results = [];

    for (const event of events) {
      const teamCount = await prisma.team.count({
        where: { eventId: event.id, status: 'accepted', deletedAt: null },
      });

      if (teamCount < 4) {
        results.push({
          eventId: event.id,
          eventName: event.name,
          status: 'skipped',
          reason: 'Minimo de 4 duplas para gerar chaveamento.',
          teamCount,
        });
        continue;
      }

      const groupCount = teamCount >= 8 ? 4 : 2;

      try {
        const draw = await this.drawsService.generateGroupKnockout(event.id, groupCount);
        results.push({
          eventId: event.id,
          eventName: event.name,
          status: 'generated',
          groupCount,
          teamCount,
          drawId: draw.draw.id,
        });
      } catch (err: any) {
        results.push({
          eventId: event.id,
          eventName: event.name,
          status: 'error',
          reason: err.message ?? 'Erro ao gerar chaveamento.',
          teamCount,
        });
      }
    }

    return {
      tournamentId,
      totalEvents: events.length,
      generated: results.filter((item) => item.status === 'generated').length,
      skipped: results.filter((item) => item.status === 'skipped').length,
      errors: results.filter((item) => item.status === 'error').length,
      results,
    };
  }

  @Post('events/:eventId/generate-knockout')
  async generateKnockout(
    @Param('eventId') eventId: string,
    @Body() body: { advancePerGroup?: number },
  ) {
    return this.drawsService.generateKnockout(eventId, body.advancePerGroup ?? 2);
  }

  @Post('events/:eventId/standings/recalculate')
  async recalculate(@Param('eventId') eventId: string) {
    return { success: true, message: 'Use o endpoint /groups/:groupId/standings' };
  }

  @Post('groups/:groupId/standings/recalculate')
  async recalculateGroup(@Param('groupId') groupId: string) {
    return this.drawsService.recalculateStandings(groupId);
  }

  @Public()
  @Get('events/:eventId/bracket')
  async getBracket(@Param('eventId') eventId: string, @Res({ passthrough: true }) res: Response) {
    // Live bracket: 30-second public cache — balances freshness vs. DB load
    res.setHeader('Cache-Control', 'public, max-age=30, stale-while-revalidate=60');
    return this.drawsService.getBracketData(eventId);
  }

  @Delete('events/:eventId/bracket')
  async deleteBracket(@Param('eventId') eventId: string) {
    return this.drawsService.resetBracket(eventId);
  }

  @Put('events/:eventId/bracket/manual')
  async assignManual(
    @Param('eventId') eventId: string,
    @Body()
    body: { assignments: { matchId: string; team1Id: string | null; team2Id: string | null }[] },
  ) {
    return this.drawsService.assignMatchTeams(eventId, body.assignments ?? []);
  }

  @Public()
  @Get('ranking')
  async getRanking(@Query('category') category?: string, @Res({ passthrough: true }) res: Response) {
    // Ranking is relatively static — 5-minute cache
    res.setHeader('Cache-Control', 'public, max-age=300, stale-while-revalidate=600');
    return this.drawsService.getRanking(category);
  }
}
