'use client';
import { use, useEffect, useState } from 'react';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

type PageProps = { params: Promise<{ eventId: string }> };

type Match = {
  id: string;
  matchNumber: number;
  roundName: string;
  status: string;
  courtId?: string | null;
  scheduledAt?: string | null;
  team1: { id: string; label: string } | null;
  team2: { id: string; label: string } | null;
  winner: { id: string; label: string } | null;
  sets: Array<{ setNumber: number; team1Games: number; team2Games: number; tieBreakTeam1?: number | null; tieBreakTeam2?: number | null }>;
};

const STATUS_INFO: Record<string, { label: string; cls: string }> = {
  live:      { label: 'AO VIVO', cls: 'badge-live' },
  completed: { label: 'Encerrado', cls: 'badge-done' },
  scheduled: { label: 'Agendado', cls: 'badge-draft' },
  called:    { label: 'Chamado',  cls: 'badge-ongoing' },
  warmup:    { label: 'Aquecendo', cls: 'badge-ongoing' },
  walkover:  { label: 'W.O.',    cls: 'badge-draft' },
};

function ScoreDisplay({ sets }: { sets: Match['sets'] }) {
  if (!sets.length) return null;
  return (
    <div style={{ display: 'flex', gap: '0.375rem' }}>
      {sets.map(s => (
        <span key={s.setNumber} style={{
          fontFamily: 'Barlow Condensed, sans-serif',
          fontSize: '0.85rem', fontWeight: 700,
          background: 'var(--bg-elevated)',
          padding: '0.1rem 0.4rem',
          borderRadius: '4px',
          color: 'var(--text-primary)',
          letterSpacing: '0.02em',
        }}>
          {s.team1Games}-{s.team2Games}
          {s.tieBreakTeam1 != null ? `(${s.tieBreakTeam1})` : ''}
        </span>
      ))}
    </div>
  );
}

export default function LiveScorePage({ params }: PageProps) {
  const { eventId } = use(params);
  const [matches, setMatches]   = useState<Match[]>([]);
  const [eventName, setEventName] = useState('');
  const [loading, setLoading]   = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  async function load() {
    try {
      const [matchRes, eventRes] = await Promise.all([
        fetch(`${API_URL}/matches?eventId=${eventId}&status=live`).then(r => r.json()),
        fetch(`${API_URL}/events/${eventId}`).then(r => r.json()),
      ]);
      setMatches(Array.isArray(matchRes) ? matchRes : matchRes.matches ?? []);
      setEventName(eventRes?.name ?? 'Evento');
      setLastUpdate(new Date());
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    const interval = setInterval(load, 15000);
    return () => clearInterval(interval);
  }, [eventId]);

  const liveMatches      = matches.filter(m => m.status === 'live');
  const recentMatches    = matches.filter(m => m.status === 'completed').slice(0, 10);
  const upcomingMatches  = matches.filter(m => m.status === 'scheduled' || m.status === 'called');

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)' }}>
      <nav className="navbar">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center gap-4">
          <a href="/torneios" style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', textDecoration: 'none' }}>
            <div style={{ width: '1.75rem', height: '1.75rem', borderRadius: '6px', background: 'var(--accent-lime)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.9rem' }}>🎾</div>
            <span style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>Arena Beach Tennis</span>
          </a>
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            {lastUpdate && (
              <span style={{ fontSize: '0.7rem', color: 'var(--text-faint)' }}>
                Atualizado às {lastUpdate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </span>
            )}
            <button onClick={load} className="btn btn-secondary btn-sm">↻ Atualizar</button>
          </div>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <div style={{ marginBottom: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
            <span className="badge badge-live" style={{ fontSize: '0.75rem' }}>
              <span className="live-dot" style={{ display: 'inline-block', width: '6px', height: '6px', borderRadius: '50%', background: 'var(--accent-red)', marginRight: '4px' }} />
              AO VIVO
            </span>
          </div>
          <h1 style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: '2rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
            {loading ? '...' : eventName}
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', margin: '0.25rem 0 0' }}>
            Placar em tempo real · Atualização automática a cada 15s
          </p>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '4rem 0' }}>
            <span className="spinner" style={{ width: '2rem', height: '2rem', borderWidth: '3px' }} />
            <p style={{ color: 'var(--text-muted)', marginTop: '1rem', fontSize: '0.875rem' }}>Carregando partidas...</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            {/* Live */}
            {liveMatches.length > 0 && (
              <section>
                <h2 style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: '1.25rem', fontWeight: 700, color: 'var(--accent-red)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span className="live-dot" style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', background: 'var(--accent-red)' }} />
                  Em quadra agora ({liveMatches.length})
                </h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1rem' }}>
                  {liveMatches.map(m => <LiveMatchCard key={m.id} match={m} />)}
                </div>
              </section>
            )}

            {/* Upcoming */}
            {upcomingMatches.length > 0 && (
              <section>
                <h2 style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '1rem' }}>
                  Próximas partidas ({upcomingMatches.length})
                </h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
                  {upcomingMatches.map(m => <CompactMatchRow key={m.id} match={m} />)}
                </div>
              </section>
            )}

            {/* Recent */}
            {recentMatches.length > 0 && (
              <section>
                <h2 style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '1rem' }}>
                  Resultados recentes
                </h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
                  {recentMatches.map(m => <CompactMatchRow key={m.id} match={m} />)}
                </div>
              </section>
            )}

            {matches.length === 0 && (
              <div className="empty-state">
                <span className="empty-state-icon">🎾</span>
                <p style={{ fontWeight: 600 }}>Nenhuma partida encontrada</p>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-faint)' }}>O evento ainda não iniciou ou não há partidas registradas</p>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

function LiveMatchCard({ match }: { match: Match }) {
  return (
    <div style={{
      background: 'var(--bg-card)',
      border: '1px solid rgba(255,64,96,0.4)',
      borderRadius: 'var(--radius-lg)',
      overflow: 'hidden',
      boxShadow: '0 0 20px rgba(255,64,96,0.1)',
    }}>
      <div style={{ background: 'rgba(255,64,96,0.08)', borderBottom: '1px solid rgba(255,64,96,0.2)', padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <span className="live-dot" style={{ display: 'inline-block', width: '7px', height: '7px', borderRadius: '50%', background: 'var(--accent-red)' }} />
        <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#FF6080', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Ao Vivo</span>
        <span style={{ marginLeft: 'auto', fontSize: '0.7rem', color: 'var(--text-faint)' }}>#{match.matchNumber} · {match.roundName}</span>
      </div>
      <div style={{ padding: '1rem' }}>
        {[
          { team: match.team1, isWinner: match.winner?.id === match.team1?.id },
          { team: match.team2, isWinner: match.winner?.id === match.team2?.id },
        ].map(({ team, isWinner }, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.625rem 0.75rem', borderRadius: 'var(--radius-sm)', background: isWinner ? 'rgba(0,200,80,0.08)' : 'transparent', marginBottom: i === 0 ? '0.375rem' : 0 }}>
            <span style={{ flex: 1, fontWeight: 600, fontSize: '0.9rem', color: team ? 'var(--text-primary)' : 'var(--text-faint)' }}>
              {team?.label ?? 'A definir'}
            </span>
            <ScoreDisplay sets={match.sets} />
          </div>
        ))}
      </div>
    </div>
  );
}

function CompactMatchRow({ match }: { match: Match }) {
  const info = STATUS_INFO[match.status] ?? STATUS_INFO.scheduled;
  const isCompleted = match.status === 'completed';

  return (
    <div style={{
      background: 'var(--bg-card)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius-md)',
      padding: '0.75rem 1rem',
      display: 'flex',
      alignItems: 'center',
      gap: '0.75rem',
    }}>
      <span style={{ fontSize: '0.7rem', color: 'var(--text-faint)', minWidth: '2rem' }}>#{match.matchNumber}</span>
      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: '0.5rem', alignItems: 'center' }}>
        <span style={{
          fontSize: '0.85rem', fontWeight: 600, textAlign: 'right',
          color: isCompleted && match.winner?.id === match.team1?.id ? '#00C850' : 'var(--text-primary)',
        }}>
          {match.team1?.label ?? '?'}
        </span>
        <div style={{ textAlign: 'center' }}>
          {match.sets.length > 0 ? <ScoreDisplay sets={match.sets} /> : <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-faint)' }}>VS</span>}
        </div>
        <span style={{
          fontSize: '0.85rem', fontWeight: 600,
          color: isCompleted && match.winner?.id === match.team2?.id ? '#00C850' : 'var(--text-primary)',
        }}>
          {match.team2?.label ?? '?'}
        </span>
      </div>
      <span className={`badge ${info.cls}`}>{info.label}</span>
    </div>
  );
}
