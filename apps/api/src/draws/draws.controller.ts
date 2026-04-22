import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { DrawsService } from './draws.service';

@Controller()
export class DrawsController {
  constructor(private readonly drawsService: DrawsService) {}

  // Gerar chaveamento grupos + mata-mata
  @Post('draws/generate-group-knockout')
  async generate(@Body() body: { eventId: string; groupCount?: number }) {
    return this.drawsService.generateGroupKnockout(body.eventId, body.groupCount ?? 2);
  }

  // Gerar mata-mata manualmente (depois da fase de grupos)
  @Post('events/:eventId/generate-knockout')
  async generateKnockout(
    @Param('eventId') eventId: string,
    @Body() body: { advancePerGroup?: number },
  ) {
    return this.drawsService.generateKnockout(eventId, body.advancePerGroup ?? 2);
  }

  // Recalcular standings de um grupo
  @Post('events/:eventId/standings/recalculate')
  async recalculate(@Param('eventId') eventId: string) {
    return { success: true, message: 'Use o endpoint /groups/:groupId/standings' };
  }

  @Post('groups/:groupId/standings/recalculate')
  async recalculateGroup(@Param('groupId') groupId: string) {
    return this.drawsService.recalculateStandings(groupId);
  }

  // Dados completos do bracket (grupos + knockout + campeão)
  @Get('events/:eventId/bracket')
  async getBracket(@Param('eventId') eventId: string) {
    return this.drawsService.getBracketData(eventId);
  }

  // Ranking geral de jogadores
  @Get('ranking')
  async getRanking(@Query('category') category?: string) {
    return this.drawsService.getRanking(category);
  }
}
