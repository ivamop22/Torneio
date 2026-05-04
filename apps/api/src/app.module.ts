import { Module, OnApplicationBootstrap } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import * as bcrypt from 'bcryptjs';
import { TournamentsController } from './tournaments/tournaments.controller';
import { EventsController } from './events/events.controller';
import { PlayersController } from './players/players.controller';
import { TeamsController } from './teams/teams.controller';
import { MatchesController } from './matches/matches.controller';
import { DrawsController } from './draws/draws.controller';
import { RegistrationsController } from './registrations/registrations.controller';
import { DrawsService } from './draws/draws.service';
import { AuthModule } from './auth/auth.module';
import { JwtAuthGuard } from './auth/jwt-auth.guard';
import { SuperuserModule } from './superuser/superuser.module';
import { prisma } from './lib/prisma';

@Module({
  imports: [AuthModule, SuperuserModule],
  controllers: [
    TournamentsController,
    EventsController,
    PlayersController,
    TeamsController,
    MatchesController,
    DrawsController,
    RegistrationsController,
  ],
  providers: [
    DrawsService,
    { provide: APP_GUARD, useClass: JwtAuthGuard },
  ],
  exports: [DrawsService],
})
export class AppModule implements OnApplicationBootstrap {
  async onApplicationBootstrap() {
    try {
      const email = 'chrisjsp35@gmail.com';
      await prisma.user.upsert({
        where: { email },
        create: {
          email,
          name: 'Super Admin',
          role: 'superuser',
          passwordHash: bcrypt.hashSync('V1toriA20215', 10),
          status: 'active',
        },
        update: {},
      });
    } catch (e) {
      console.error('Superuser seed failed:', e);
    }
  }
}
