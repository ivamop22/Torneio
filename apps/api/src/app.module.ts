import { Module } from '@nestjs/common';
import { TournamentsController } from './tournaments/tournaments.controller';
import { EventsController } from './events/events.controller';
import { PlayersController } from './players/players.controller';
import { TeamsController } from './teams/teams.controller';
import { MatchesController } from './matches/matches.controller';
import { DrawsController } from './draws/draws.controller';
import { RegistrationsController } from './registrations/registrations.controller';
import { DrawsService } from './draws/draws.service';

@Module({
  controllers: [
    TournamentsController,
    EventsController,
    PlayersController,
    TeamsController,
    MatchesController,
    DrawsController,
    RegistrationsController,
  ],
  providers: [DrawsService],
  exports: [DrawsService],
})
export class AppModule {}
