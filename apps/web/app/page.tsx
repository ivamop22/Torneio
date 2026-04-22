'use client';

import { FormEvent, useEffect, useState } from 'react';

type Tournament = {
  id: string;
  name: string;
  slug: string;
  level: string;
  status: string;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  startDate: string;
  endDate: string;
};

type EventItem = {
  id: string;
  tournamentId: string;
  name: string;
  gender: string;
  format: string;
  category?: string | null;
  status: string;
};

type Player = {
  id: string;
  fullName: string;
  birthDate?: string | null;
  gender?: string | null;
  nationality?: string | null;
  phone?: string | null;
  email?: string | null;
  rankingPoints: number;
  eligibilityStatus: string;
  active: boolean;
};

type Team = {
  id: string;
  seed?: number | null;
  wildCard?: boolean;
  event?: {
    id: string;
    name: string;
  } | null;
  player1?: {
    id: string;
    fullName: string;
  } | null;
  player2?: {
    id: string;
    fullName: string;
  } | null;
};

type MatchItem = {
  id: string;
  roundName: string;
  matchNumber?: number | null;
  status: string;
  team1Id?: string | null;
  team2Id?: string | null;
};

export default function HomePage() {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [matches, setMatches] = useState<MatchItem[]>([]);
  const [loading, setLoading] = useState(true);

  const [name, setName] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [country, setCountry] = useState('BR');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const [eventTournamentId, setEventTournamentId] = useState('');
  const [eventName, setEventName] = useState('');
  const [eventGender, setEventGender] = useState('male');
  const [eventFormat, setEventFormat] = useState('group_knockout');
  const [eventCategory, setEventCategory] = useState('');
  const [eventMaxPairs, setEventMaxPairs] = useState('');
  const [eventEntryFee, setEventEntryFee] = useState('');

  const [playerFullName, setPlayerFullName] = useState('');
  const [playerBirthDate, setPlayerBirthDate] = useState('');
  const [playerGender, setPlayerGender] = useState('');
  const [playerNationality, setPlayerNationality] = useState('');
  const [playerPhone, setPlayerPhone] = useState('');
  const [playerEmail, setPlayerEmail] = useState('');
  const [playerDocumentId, setPlayerDocumentId] = useState('');
  const [playerIpin, setPlayerIpin] = useState('');

  const [teamEventId, setTeamEventId] = useState('');
  const [player1Id, setPlayer1Id] = useState('');
  const [player2Id, setPlayer2Id] = useState('');
  const [seed, setSeed] = useState('');
  const [wildCard, setWildCard] = useState(false);

  const [drawEventId, setDrawEventId] = useState('');

  async function loadTournaments() {
    const res = await fetch('http://localhost:3001/tournaments', { cache: 'no-store' });
    const data = await res.json();
    setTournaments(data);

    if (data.length > 0 && !eventTournamentId) {
      setEventTournamentId(data[0].id);
    }
  }

  async function loadEvents() {
    const res = await fetch('http://localhost:3001/events', { cache: 'no-store' });
    const data = await res.json();
    setEvents(data);

    if (data.length > 0 && !teamEventId) {
      setTeamEventId(data[0].id);
    }

    if (data.length > 0 && !drawEventId) {
      setDrawEventId(data[0].id);
    }
  }

  async function loadPlayers() {
    const res = await fetch('http://localhost:3001/players', { cache: 'no-store' });
    const data = await res.json();
    setPlayers(data);
  }

  async function loadTeams() {
    const res = await fetch('http://localhost:3001/teams', { cache: 'no-store' });
    const data = await res.json();
    setTeams(data);
  }

  async function loadMatches() {
    const res = await fetch('http://localhost:3001/matches', { cache: 'no-store' });
    const data = await res.json();
    setMatches(data);
  }

  async function loadAll() {
    setLoading(true);
    await Promise.all([
      loadTournaments(),
      loadEvents(),
      loadPlayers(),
      loadTeams(),
      loadMatches(),
    ]);
    setLoading(false);
  }

  useEffect(() => {
    loadAll();
  }, []);

  async function handleTournamentSubmit(e: FormEvent) {
    e.preventDefault();

    await fetch('http://localhost:3001/tournaments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, city, state, country, startDate, endDate }),
    });

    setName('');
    setCity('');
    setState('');
    setCountry('BR');
    setStartDate('');
    setEndDate('');
    await loadTournaments();
  }

  async function handleEventSubmit(e: FormEvent) {
    e.preventDefault();

    await fetch('http://localhost:3001/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tournamentId: eventTournamentId,
        name: eventName,
        gender: eventGender,
        format: eventFormat,
        category: eventCategory,
        maxPairs: eventMaxPairs ? Number(eventMaxPairs) : undefined,
        entryFee: eventEntryFee ? Number(eventEntryFee) : undefined,
      }),
    });

    setEventName('');
    setEventGender('male');
    setEventFormat('group_knockout');
    setEventCategory('');
    setEventMaxPairs('');
    setEventEntryFee('');
    await loadEvents();
  }

  async function handlePlayerSubmit(e: FormEvent) {
    e.preventDefault();

    await fetch('http://localhost:3001/players', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fullName: playerFullName,
        birthDate: playerBirthDate || undefined,
        gender: playerGender || undefined,
        nationality: playerNationality || undefined,
        phone: playerPhone || undefined,
        email: playerEmail || undefined,
        documentId: playerDocumentId || undefined,
        ipin: playerIpin || undefined,
      }),
    });

    setPlayerFullName('');
    setPlayerBirthDate('');
    setPlayerGender('');
    setPlayerNationality('');
    setPlayerPhone('');
    setPlayerEmail('');
    setPlayerDocumentId('');
    setPlayerIpin('');
    await loadPlayers();
  }

  async function handleTeamSubmit(e: FormEvent) {
    e.preventDefault();

    await fetch('http://localhost:3001/teams', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        eventId: teamEventId,
        player1Id,
        player2Id,
        seed: seed ? Number(seed) : undefined,
        wildCard,
      }),
    });

    setPlayer1Id('');
    setPlayer2Id('');
    setSeed('');
    setWildCard(false);
    await loadTeams();
  }

  async function handleGenerateDraw(e: FormEvent) {
    e.preventDefault();

    await fetch('http://localhost:3001/draws/generate-group-knockout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        eventId: drawEventId,
        groupCount: 2,
      }),
    });

    await loadMatches();
  }

  return (
    <main style={{ maxWidth: 1000, margin: '0 auto', padding: 24, fontFamily: 'Arial, sans-serif' }}>
      <h1>Beach Tennis Platform</h1>
      <p>Cadastro de torneios, eventos, jogadores, duplas e partidas</p>

      <section style={{ marginTop: 24, marginBottom: 40 }}>
        <h2>Criar torneio</h2>
        <form onSubmit={handleTournamentSubmit} style={{ display: 'grid', gap: 12, padding: 16, border: '1px solid #ddd', borderRadius: 12 }}>
          <input placeholder="Nome do torneio" value={name} onChange={(e) => setName(e.target.value)} required />
          <input placeholder="Cidade" value={city} onChange={(e) => setCity(e.target.value)} />
          <input placeholder="Estado" value={state} onChange={(e) => setState(e.target.value)} />
          <input placeholder="País" value={country} onChange={(e) => setCountry(e.target.value)} />
          <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} required />
          <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} required />
          <button type="submit">Criar torneio</button>
        </form>
      </section>

      <section style={{ marginBottom: 40 }}>
        <h2>Criar evento</h2>
        <form onSubmit={handleEventSubmit} style={{ display: 'grid', gap: 12, padding: 16, border: '1px solid #ddd', borderRadius: 12 }}>
          <select value={eventTournamentId} onChange={(e) => setEventTournamentId(e.target.value)} required>
            <option value="">Selecione um torneio</option>
            {tournaments.map((t) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>

          <input placeholder="Nome do evento" value={eventName} onChange={(e) => setEventName(e.target.value)} required />

          <select value={eventGender} onChange={(e) => setEventGender(e.target.value)}>
            <option value="male">Masculino</option>
            <option value="female">Feminino</option>
            <option value="mixed">Misto</option>
            <option value="open">Open</option>
          </select>

          <select value={eventFormat} onChange={(e) => setEventFormat(e.target.value)}>
            <option value="group_knockout">Grupos + mata-mata</option>
            <option value="group_stage">Fase de grupos</option>
            <option value="knockout">Mata-mata</option>
          </select>

          <input placeholder="Categoria" value={eventCategory} onChange={(e) => setEventCategory(e.target.value)} />
          <input placeholder="Máximo de duplas" value={eventMaxPairs} onChange={(e) => setEventMaxPairs(e.target.value)} />
          <input placeholder="Valor da inscrição" value={eventEntryFee} onChange={(e) => setEventEntryFee(e.target.value)} />
          <button type="submit">Criar evento</button>
        </form>
      </section>

      <section style={{ marginBottom: 40 }}>
        <h2>Criar jogador</h2>
        <form onSubmit={handlePlayerSubmit} style={{ display: 'grid', gap: 12, padding: 16, border: '1px solid #ddd', borderRadius: 12 }}>
          <input placeholder="Nome completo" value={playerFullName} onChange={(e) => setPlayerFullName(e.target.value)} required />
          <input type="date" value={playerBirthDate} onChange={(e) => setPlayerBirthDate(e.target.value)} />
          <select value={playerGender} onChange={(e) => setPlayerGender(e.target.value)}>
            <option value="">Selecione o gênero</option>
            <option value="male">Masculino</option>
            <option value="female">Feminino</option>
            <option value="other">Outro</option>
          </select>
          <input placeholder="Nacionalidade" value={playerNationality} onChange={(e) => setPlayerNationality(e.target.value)} />
          <input placeholder="Telefone" value={playerPhone} onChange={(e) => setPlayerPhone(e.target.value)} />
          <input placeholder="E-mail" value={playerEmail} onChange={(e) => setPlayerEmail(e.target.value)} />
          <input placeholder="Documento" value={playerDocumentId} onChange={(e) => setPlayerDocumentId(e.target.value)} />
          <input placeholder="IPIN" value={playerIpin} onChange={(e) => setPlayerIpin(e.target.value)} />
          <button type="submit">Criar jogador</button>
        </form>
      </section>

      <section style={{ marginBottom: 40 }}>
        <h2>Criar dupla</h2>
        <form onSubmit={handleTeamSubmit} style={{ display: 'grid', gap: 12, padding: 16, border: '1px solid #ddd', borderRadius: 12 }}>
          <select value={teamEventId} onChange={(e) => setTeamEventId(e.target.value)} required>
            <option value="">Selecione evento</option>
            {events.map((e) => (
              <option key={e.id} value={e.id}>{e.name}</option>
            ))}
          </select>

          <select value={player1Id} onChange={(e) => setPlayer1Id(e.target.value)} required>
            <option value="">Jogador 1</option>
            {players.map((p) => (
              <option key={p.id} value={p.id}>{p.fullName}</option>
            ))}
          </select>

          <select value={player2Id} onChange={(e) => setPlayer2Id(e.target.value)} required>
            <option value="">Jogador 2</option>
            {players.map((p) => (
              <option key={p.id} value={p.id}>{p.fullName}</option>
            ))}
          </select>

          <input placeholder="Seed" value={seed} onChange={(e) => setSeed(e.target.value)} />

          <label>
            <input type="checkbox" checked={wildCard} onChange={(e) => setWildCard(e.target.checked)} />
            Wildcard
          </label>

          <button type="submit">Criar dupla</button>
        </form>
      </section>

      <section style={{ marginBottom: 40 }}>
        <h2>Gerar grupos + mata-mata</h2>
        <form onSubmit={handleGenerateDraw} style={{ display: 'grid', gap: 12, padding: 16, border: '1px solid #ddd', borderRadius: 12 }}>
          <select value={drawEventId} onChange={(e) => setDrawEventId(e.target.value)} required>
            <option value="">Selecione evento</option>
            {events.map((e) => (
              <option key={e.id} value={e.id}>{e.name}</option>
            ))}
          </select>

          <button type="submit">Gerar grupos + mata-mata</button>
        </form>
      </section>

      <section style={{ marginBottom: 40 }}>
        <h2>Torneios cadastrados</h2>
        {loading ? <p>Carregando...</p> : tournaments.length === 0 ? <p>Nenhum torneio cadastrado.</p> : (
          <div style={{ display: 'grid', gap: 12 }}>
            {tournaments.map((t) => (
              <div key={t.id} style={{ border: '1px solid #ddd', borderRadius: 12, padding: 16 }}>
                <h3 style={{ margin: 0 }}>{t.name}</h3>
                <p>{t.city || 'Sem cidade'} • {t.state || 'Sem estado'} • {t.country || 'BR'}</p>
                <p>{t.startDate?.slice(0, 10)} até {t.endDate?.slice(0, 10)}</p>
                <p>Status: {t.status}</p>
              </div>
            ))}
          </div>
        )}
      </section>

      <section style={{ marginBottom: 40 }}>
        <h2>Eventos cadastrados</h2>
        {loading ? <p>Carregando...</p> : events.length === 0 ? <p>Nenhum evento cadastrado.</p> : (
          <div style={{ display: 'grid', gap: 12 }}>
            {events.map((event) => (
              <div key={event.id} style={{ border: '1px solid #ddd', borderRadius: 12, padding: 16 }}>
                <h3 style={{ margin: 0 }}>{event.name}</h3>
                <p>Categoria: {event.category || 'Sem categoria'}</p>
                <p>Gênero: {event.gender}</p>
                <p>Formato: {event.format}</p>
                <p>Status: {event.status}</p>
              </div>
            ))}
          </div>
        )}
      </section>

      <section style={{ marginBottom: 40 }}>
        <h2>Jogadores cadastrados</h2>
        {loading ? <p>Carregando...</p> : players.length === 0 ? <p>Nenhum jogador cadastrado.</p> : (
          <div style={{ display: 'grid', gap: 12 }}>
            {players.map((player) => (
              <div key={player.id} style={{ border: '1px solid #ddd', borderRadius: 12, padding: 16 }}>
                <h3 style={{ margin: 0 }}>{player.fullName}</h3>
                <p>Gênero: {player.gender || 'Não informado'}</p>
                <p>Nacionalidade: {player.nationality || 'Não informada'}</p>
                <p>E-mail: {player.email || 'Não informado'}</p>
                <p>Pontos: {player.rankingPoints}</p>
                <p>Elegibilidade: {player.eligibilityStatus}</p>
              </div>
            ))}
          </div>
        )}
      </section>

      <section style={{ marginBottom: 40 }}>
        <h2>Duplas cadastradas</h2>
        {loading ? <p>Carregando...</p> : teams.length === 0 ? <p>Nenhuma dupla cadastrada.</p> : (
          <div style={{ display: 'grid', gap: 12 }}>
            {teams.map((team) => (
              <div key={team.id} style={{ border: '1px solid #ddd', borderRadius: 12, padding: 16 }}>
                <h3 style={{ margin: 0 }}>
                  {team.player1?.fullName} / {team.player2?.fullName}
                </h3>
                <p>Evento: {team.event?.name || '—'}</p>
                <p>Seed: {team.seed || '—'}</p>
                <p>Wildcard: {team.wildCard ? 'Sim' : 'Não'}</p>
                <p>Status: {(team as any).status || '—'}</p>
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2>Partidas geradas</h2>
        {loading ? <p>Carregando...</p> : matches.length === 0 ? <p>Nenhuma partida gerada.</p> : (
          <div style={{ display: 'grid', gap: 12 }}>
            {matches.map((match) => (
              <div key={match.id} style={{ border: '1px solid #ddd', borderRadius: 12, padding: 16 }}>
                <h3 style={{ margin: 0 }}>{match.roundName}</h3>
                <p>Match #{match.matchNumber || '—'}</p>
                <p>Status: {match.status}</p>
                <p>Team 1 ID: {match.team1Id || '—'}</p>
                <p>Team 2 ID: {match.team2Id || '—'}</p>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
