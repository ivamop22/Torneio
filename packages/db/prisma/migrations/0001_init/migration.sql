CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(120) NOT NULL,
  email VARCHAR(180) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role VARCHAR(30) NOT NULL CHECK (role IN ('admin','organizer','referee','player','viewer')),
  status VARCHAR(20) NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

CREATE TABLE clubs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(160) NOT NULL,
  city VARCHAR(120),
  state VARCHAR(120),
  country VARCHAR(120) DEFAULT 'BR',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

CREATE TABLE courts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id UUID REFERENCES clubs(id) ON DELETE CASCADE,
  name VARCHAR(80) NOT NULL,
  surface VARCHAR(50) DEFAULT 'sand',
  net_height_m NUMERIC(4,2),
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ,
  UNIQUE (club_id, name)
);

CREATE TABLE tournaments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id UUID REFERENCES clubs(id) ON DELETE SET NULL,
  name VARCHAR(180) NOT NULL,
  slug VARCHAR(200) UNIQUE NOT NULL,
  level VARCHAR(40) NOT NULL DEFAULT 'recreational',
  status VARCHAR(20) NOT NULL DEFAULT 'draft',
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  city VARCHAR(120),
  state VARCHAR(120),
  country VARCHAR(120) DEFAULT 'BR',
  is_online BOOLEAN NOT NULL DEFAULT false,
  organizer_notes TEXT,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

CREATE TABLE tournament_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id UUID NOT NULL UNIQUE REFERENCES tournaments(id) ON DELETE CASCADE,
  best_of_sets SMALLINT NOT NULL DEFAULT 3,
  games_to_win_set SMALLINT NOT NULL DEFAULT 6,
  games_margin SMALLINT NOT NULL DEFAULT 2,
  tie_break_at_games SMALLINT NOT NULL DEFAULT 6,
  tie_break_points SMALLINT NOT NULL DEFAULT 7,
  final_set_match_tiebreak_points SMALLINT NOT NULL DEFAULT 10,
  no_ad BOOLEAN NOT NULL DEFAULT true,
  allow_mixed BOOLEAN NOT NULL DEFAULT true,
  allow_singles BOOLEAN NOT NULL DEFAULT false,
  allow_partner_rotation BOOLEAN NOT NULL DEFAULT false,
  prohibit_service_return_zone_meters NUMERIC(3,1) NOT NULL DEFAULT 3.0,
  warmup_seconds SMALLINT NOT NULL DEFAULT 300,
  changeover_seconds SMALLINT NOT NULL DEFAULT 90,
  set_break_seconds SMALLINT NOT NULL DEFAULT 120,
  classification_win_points INT NOT NULL DEFAULT 2,
  classification_loss_points INT NOT NULL DEFAULT 1,
  classification_walkover_loss_points INT NOT NULL DEFAULT 0,
  tiebreak_criteria JSONB NOT NULL DEFAULT '["wins","points","set_diff","game_diff","games_for","head_to_head","draw"]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id UUID NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
  name VARCHAR(160) NOT NULL,
  gender VARCHAR(20) NOT NULL CHECK (gender IN ('male','female','mixed','open')),
  format VARCHAR(30) NOT NULL CHECK (format IN ('double_fixed','double_rotating','group_stage','knockout','round_robin','group_knockout')),
  category VARCHAR(60),
  level VARCHAR(60),
  max_pairs INT,
  min_pairs INT,
  entry_fee NUMERIC(10,2) DEFAULT 0,
  entry_deadline TIMESTAMPTZ,
  withdrawal_deadline TIMESTAMPTZ,
  check_in_deadline TIMESTAMPTZ,
  status VARCHAR(20) NOT NULL DEFAULT 'draft',
  rules JSONB,
  seeding_criteria JSONB,
  pairing_mode VARCHAR(40),
  is_official BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

CREATE TABLE players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name VARCHAR(180) NOT NULL,
  birth_date DATE,
  gender VARCHAR(20) CHECK (gender IN ('male','female','other')),
  nationality VARCHAR(80),
  phone VARCHAR(30),
  email VARCHAR(180),
  document_id VARCHAR(80),
  ipin VARCHAR(80),
  ranking_points INT NOT NULL DEFAULT 0,
  eligibility_status VARCHAR(20) NOT NULL DEFAULT 'eligible',
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

CREATE TABLE event_players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  seed_ranking INT,
  check_in_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (event_id, player_id)
);

CREATE TABLE teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  player1_id UUID NOT NULL REFERENCES players(id) ON DELETE RESTRICT,
  player2_id UUID REFERENCES players(id) ON DELETE RESTRICT,
  seed INT,
  wild_card BOOLEAN NOT NULL DEFAULT false,
  alternate BOOLEAN NOT NULL DEFAULT false,
  wait_list BOOLEAN NOT NULL DEFAULT false,
  status VARCHAR(20) NOT NULL DEFAULT 'accepted',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ,
  UNIQUE (event_id, player1_id, player2_id)
);

CREATE TABLE registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  player_id UUID REFERENCES players(id) ON DELETE CASCADE,
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  payment_status VARCHAR(20) NOT NULL DEFAULT 'pending',
  accepted_at TIMESTAMPTZ,
  withdrawn_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  registration_id UUID UNIQUE NOT NULL REFERENCES registrations(id) ON DELETE CASCADE,
  amount NUMERIC(10,2) NOT NULL,
  currency VARCHAR(10) NOT NULL DEFAULT 'BRL',
  provider VARCHAR(60),
  provider_ref VARCHAR(120),
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  paid_at TIMESTAMPTZ,
  refunded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE draws (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  draw_type VARCHAR(30) NOT NULL CHECK (draw_type IN ('single_elimination','double_elimination','round_robin','group_knockout')),
  generated_by UUID REFERENCES users(id) ON DELETE SET NULL,
  generated_at TIMESTAMPTZ,
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE event_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  name VARCHAR(30) NOT NULL,
  position INT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (event_id, name)
);

CREATE TABLE event_group_standings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_group_id UUID NOT NULL REFERENCES event_groups(id) ON DELETE CASCADE,
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  played INT NOT NULL DEFAULT 0,
  wins INT NOT NULL DEFAULT 0,
  losses INT NOT NULL DEFAULT 0,
  walkovers INT NOT NULL DEFAULT 0,
  sets_for INT NOT NULL DEFAULT 0,
  sets_against INT NOT NULL DEFAULT 0,
  games_for INT NOT NULL DEFAULT 0,
  games_against INT NOT NULL DEFAULT 0,
  points INT NOT NULL DEFAULT 0,
  rank_position INT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (event_group_id, team_id)
);

CREATE TABLE matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  draw_id UUID REFERENCES draws(id) ON DELETE CASCADE,
  group_id UUID REFERENCES event_groups(id) ON DELETE SET NULL,
  court_id UUID REFERENCES courts(id) ON DELETE SET NULL,
  round_name VARCHAR(80) NOT NULL,
  match_number INT,
  team1_id UUID REFERENCES teams(id) ON DELETE SET NULL,
  team2_id UUID REFERENCES teams(id) ON DELETE SET NULL,
  scheduled_at TIMESTAMPTZ,
  called_at TIMESTAMPTZ,
  started_at TIMESTAMPTZ,
  finished_at TIMESTAMPTZ,
  status VARCHAR(20) NOT NULL DEFAULT 'scheduled',
  winner_team_id UUID REFERENCES teams(id) ON DELETE SET NULL,
  loser_team_id UUID REFERENCES teams(id) ON DELETE SET NULL,
  walkover BOOLEAN NOT NULL DEFAULT false,
  no_show BOOLEAN NOT NULL DEFAULT false,
  retired_team_id UUID REFERENCES teams(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE match_sets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  set_number SMALLINT NOT NULL,
  team1_games SMALLINT NOT NULL DEFAULT 0,
  team2_games SMALLINT NOT NULL DEFAULT 0,
  tie_break_team1 SMALLINT,
  tie_break_team2 SMALLINT,
  is_match_tiebreak BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (match_id, set_number)
);

CREATE TABLE rankings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  event_id UUID REFERENCES events(id) ON DELETE SET NULL,
  category VARCHAR(60),
  points INT NOT NULL DEFAULT 0,
  ranking_date DATE NOT NULL DEFAULT CURRENT_DATE,
  source VARCHAR(80),
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(30) NOT NULL,
  channel VARCHAR(20) NOT NULL CHECK (channel IN ('email','whatsapp','push','sms')),
  payload JSONB NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  template_key VARCHAR(80),
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  action VARCHAR(120) NOT NULL,
  entity_type VARCHAR(80) NOT NULL,
  entity_id UUID,
  payload JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_events_tournament_status ON events(tournament_id, status);
CREATE INDEX idx_teams_event_status ON teams(event_id, status);
CREATE INDEX idx_registrations_event_status ON registrations(event_id, status);
CREATE INDEX idx_matches_event_status ON matches(event_id, status);
CREATE INDEX idx_matches_court_time ON matches(court_id, scheduled_at);
CREATE INDEX idx_match_sets_match ON match_sets(match_id);
CREATE INDEX idx_rankings_player_date ON rankings(player_id, ranking_date);
CREATE INDEX idx_players_eligibility_status ON players(eligibility_status);
CREATE INDEX idx_notifications_user_status ON notifications(user_id, status);
CREATE INDEX idx_audit_entity ON audit_logs(entity_type, entity_id);
