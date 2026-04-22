import { Body, Controller, Post } from '@nestjs/common';
import { prisma } from '../lib/prisma';

@Controller('draws')
export class DrawsController {
  @Post('generate-group-knockout')
  async generate(@Body() body: any) {
    return { success: true, message: 'Mock draw gerado' };
  }

  @Post(':eventId/standings/recalculate')
  async recalc() {
    return { success: true, message: 'Mock standings ok' };
  }

  @Post(':eventId/generate-knockout')
  async knockout() {
    return { success: true, message: 'Mock knockout ok' };
  }
}
