import { Body, Controller, Get, Post } from '@nestjs/common';
import { prisma } from '../lib/prisma';

@Controller('players')
export class PlayersController {
  @Get()
  async findAll() {
    return prisma.player.findMany();
  }

  @Post()
  async create(@Body() body: any) {
    return prisma.player.create({
      data: body,
    });
  }
}
