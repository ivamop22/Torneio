import { Body, Controller, Get, Param, Patch, Query } from '@nestjs/common';
import { prisma } from '../lib/prisma';

@Controller('matches')
export class MatchesController {
  @Get()
  async findAll(@Query('eventId') eventId?: string) {
    return prisma.match.findMany({
      where: eventId ? { eventId } : {},
      orderBy: { createdAt: 'asc' },
    });
  }

  @Patch(':id/result')
  async setResult(@Param('id') id: string, @Body() body: any) {
    return prisma.match.update({
      where: { id },
      data: {
        winnerTeamId: body.winnerTeamId,
        status: 'completed',
        finishedAt: new Date(),
      },
    });
  }
}
