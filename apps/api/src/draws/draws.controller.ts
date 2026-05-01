import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { prisma } from '../lib/prisma';
import { DrawsService } from './draws.service';

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

  @Get('events/:eventId/bracket')
  async getBracket(@Param('eventId') eventId: string) {
    return this.drawsService.getBracketData(eventId);
  }

  @Get('ranking')
  async getRanking(@Query('category') category?: string) {
    return this.drawsService.getRanking(category);
  }
}
