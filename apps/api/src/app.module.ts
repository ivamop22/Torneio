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
