import { Body, Controller, Get, Post } from '@nestjs/common';
import { prisma } from '../lib/prisma';

@Controller('events')
export class EventsController {
  @Get()
  async findAll() {
    return prisma.event.findMany();
  }

  @Post()
  async create(@Body() body: any) {
    return prisma.event.create({
      data: body,
    });
  }
}
