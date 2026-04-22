#!/bin/bash

set -e

PROJECT_DIR=~/Downloads/beach-tennis-platform
API_DIR="$PROJECT_DIR/apps/api/src"
WEB_DIR="$PROJECT_DIR/apps/web/app"

echo "===> Bootstrap iniciado"

########################################
# API - LIB PRISMA
########################################
mkdir -p "$API_DIR/lib"

cat > "$API_DIR/lib/prisma.ts" <<'EOF'
import { PrismaClient } from '@prisma/client';

declare global {
  var prisma: PrismaClient | undefined;
}

export const prisma =
  global.prisma ??
  new PrismaClient({
    log: ['error', 'warn'],
  });

if (process.env.NODE_ENV !== 'production') {
  global.prisma = prisma;
}
EOF

########################################
# TOURNAMENTS
########################################
mkdir -p "$API_DIR/tournaments"

cat > "$API_DIR/tournaments/tournaments.controller.ts" <<'EOF'
import { Body, Controller, Get, Post } from '@nestjs/common';
import { prisma } from '../lib/prisma';

@Controller('tournaments')
export class TournamentsController {
  @Get()
  async findAll() {
    return prisma.tournament.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  @Post()
  async create(@Body() body: any) {
    const slug = body.name.toLowerCase().replace(/\s+/g, '-') + '-' + Date.now();

    return prisma.tournament.create({
      data: {
        name: body.name,
        slug,
        level: 'recreational',
        status: 'draft',
        startDate: new Date(body.startDate),
        endDate: new Date(body.endDate),
        city: body.city,
        state: body.state,
        country: body.country ?? 'BR',
      },
    });
  }
}
EOF

########################################
# EVENTS
########################################
mkdir -p "$API_DIR/events"

cat > "$API_DIR/events/events.controller.ts" <<'EOF'
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
EOF

########################################
# PLAYERS
########################################
mkdir -p "$API_DIR/players"

cat > "$API_DIR/players/players.controller.ts" <<'EOF'
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
EOF

########################################
# TEAMS
########################################
mkdir -p "$API_DIR/teams"

cat > "$API_DIR/teams/teams.controller.ts" <<'EOF'
import { Body, Controller, Get, Post } from '@nestjs/common';
import { prisma } from '../lib/prisma';

@Controller('teams')
export class TeamsController {
  @Get()
  async findAll() {
    return prisma.team.findMany({
      include: { player1: true, player2: true },
    });
  }

  @Post()
  async create(@Body() body: any) {
    return prisma.team.create({
      data: body,
    });
  }
}
EOF

########################################
# MATCHES
########################################
mkdir -p "$API_DIR/matches"

cat > "$API_DIR/matches/matches.controller.ts" <<'EOF'
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
EOF

########################################
# DRAWS (mock simplificado)
########################################
mkdir -p "$API_DIR/draws"

cat > "$API_DIR/draws/draws.controller.ts" <<'EOF'
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
EOF

########################################
# APP MODULE
########################################
cat > "$API_DIR/app.module.ts" <<'EOF'
import { Module } from '@nestjs/common';
import { TournamentsController } from './tournaments/tournaments.controller';
import { EventsController } from './events/events.controller';
import { PlayersController } from './players/players.controller';
import { TeamsController } from './teams/teams.controller';
import { MatchesController } from './matches/matches.controller';
import { DrawsController } from './draws/draws.controller';

@Module({
  controllers: [
    TournamentsController,
    EventsController,
    PlayersController,
    TeamsController,
    MatchesController,
    DrawsController,
  ],
})
export class AppModule {}
EOF

########################################
# FRONTEND
########################################
cat > "$WEB_DIR/page.tsx" <<'EOF'
'use client';

import { useEffect, useState } from 'react';

export default function Page() {
  const [events, setEvents] = useState<any[]>([]);

  async function load() {
    const res = await fetch('http://localhost:3001/events');
    const data = await res.json();
    setEvents(data);
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <main style={{ padding: 20 }}>
      <h1>Beach Tennis</h1>

      <button onClick={load}>Atualizar</button>

      <pre>{JSON.stringify(events, null, 2)}</pre>
    </main>
  );
}
EOF

########################################
# INSTALL + PRISMA
########################################
cd "$PROJECT_DIR"
pnpm install

cd "$PROJECT_DIR/apps/api"
pnpm add @prisma/client

########################################
# RODAR SETUP COMPLETO
########################################
echo "===> Rodando setup completo"
bash "$PROJECT_DIR/setup-completo.sh"

echo "===> Bootstrap finalizado 🚀"
