import {
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  Post,
  Put,
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
      throw new NotFoundException('Jogador não encontrado');
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

  @Delete(':id')
  async remove(@Param('id') id: string) {
    const existing = await prisma.player.findFirst({
      where: { id, deletedAt: null },
    });
    if (!existing) {
      throw new NotFoundException('Jogador não encontrado');
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
