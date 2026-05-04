import {
  BadRequestException,
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Post,
  Request,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { Public } from './roles.decorator';
import { prisma } from '../lib/prisma';

@Controller('auth')
export class AuthController {
  constructor(private jwt: JwtService) {}

  @Public()
  @Post('login')
  async login(@Body() body: { email: string; password: string }) {
    const user = await prisma.user.findUnique({ where: { email: body.email } });
    if (!user || user.deletedAt) throw new UnauthorizedException('Credenciais inválidas');
    if (user.status !== 'active') throw new UnauthorizedException('Usuário inativo ou bloqueado');
    const valid = await bcrypt.compare(body.password, user.passwordHash);
    if (!valid) throw new UnauthorizedException('Credenciais inválidas');
    const token = this.jwt.sign({ sub: user.id, role: user.role, email: user.email });
    return { token, user: { id: user.id, name: user.name, email: user.email, role: user.role } };
  }

  @Get('me')
  async me(@Request() req: any) {
    const user = await prisma.user.findUnique({ where: { id: req.user.userId } });
    if (!user || user.deletedAt) throw new UnauthorizedException();
    return { id: user.id, name: user.name, email: user.email, role: user.role, status: user.status };
  }

  @Public()
  @Post('admin/register/:token')
  async registerAdmin(
    @Param('token') token: string,
    @Body() body: { name: string; email: string; password: string },
  ) {
    const link = await prisma.registrationLink.findUnique({ where: { token } });
    if (!link || link.type !== 'admin_invite') throw new NotFoundException('Link inválido');
    if (link.expiresAt < new Date()) throw new BadRequestException('Link expirado');
    if (link.usedCount >= link.maxUses) throw new BadRequestException('Link já utilizado');

    const existing = await prisma.user.findUnique({ where: { email: body.email } });
    if (existing) throw new BadRequestException('E-mail já cadastrado');

    const passwordHash = await bcrypt.hash(body.password, 10);
    const user = await prisma.user.create({
      data: { name: body.name, email: body.email, passwordHash, role: 'admin', status: 'active' },
    });

    await prisma.registrationLink.update({
      where: { token },
      data: { usedCount: { increment: 1 } },
    });

    // Assign orphan tournaments (created_by = null) to the first admin created
    await prisma.tournament.updateMany({
      where: { created_by: null },
      data: { created_by: user.id },
    });

    const jwtToken = this.jwt.sign({ sub: user.id, role: user.role, email: user.email });
    return { token: jwtToken, user: { id: user.id, name: user.name, email: user.email, role: user.role } };
  }

  @Public()
  @Post('player/register/:token')
  async registerPlayer(
    @Param('token') token: string,
    @Body() body: { name: string; email: string; password: string; phone?: string },
  ) {
    const link = await prisma.registrationLink.findUnique({ where: { token } });
    if (!link || link.type !== 'player_registration') throw new NotFoundException('Link inválido');
    if (link.expiresAt < new Date()) throw new BadRequestException('Link expirado');
    if (link.usedCount >= link.maxUses) throw new BadRequestException('Link já utilizado');
    if (!link.eventId) throw new BadRequestException('Link sem evento associado');

    const existing = await prisma.user.findUnique({ where: { email: body.email } });
    if (existing) throw new BadRequestException('E-mail já cadastrado');

    const passwordHash = await bcrypt.hash(body.password, 10);
    const [user] = await prisma.$transaction([
      prisma.user.create({
        data: { name: body.name, email: body.email, passwordHash, role: 'player', status: 'active' },
      }),
    ]);

    // Create player record linked to user
    const player = await prisma.player.create({
      data: { fullName: body.name, email: body.email, phone: body.phone },
    });

    // Create registration for the event
    await prisma.registration.create({
      data: { eventId: link.eventId, playerId: player.id, status: 'pending' },
    });

    await prisma.registrationLink.update({
      where: { token },
      data: { usedCount: { increment: 1 } },
    });

    const jwtToken = this.jwt.sign({ sub: user.id, role: user.role, email: user.email });
    return { token: jwtToken, user: { id: user.id, name: user.name, email: user.email, role: user.role }, playerId: player.id };
  }
}
