'use client';
import { useEffect, useState } from 'react';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

type Stats = { tournaments: number; events: number; players: number; teams: number };
type Tournament = { id: string; name: string; slug: string; status: string; city?: string | null; state?: string | null; startDate: string; endDate: string };

const STATUS_INFO: Record<string, { label: string; cls: string }> = {
  live:      { label: 'Ao Vivo',      cls: 'badge-live' },
  finished:  { label: 'Finalizado',   cls: 'badge-done' },
  open:      { label: 'Aberto',       cls: 'badge-open' },
  ongoing:   { label: 'Em Andamento', cls: 'badge-ongoing' },
  draft:     { label: 'Rascunho',     cls: 'badge-draft' },
  published: { label: 'Publicado',    cls: 'badge-published' },
};

export default function OrganizerDashboard() {
  const [stats, setStats]             = useState<Stats>({ tournaments: 0, events: 0, players: 0, teams: 0 });
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading]         = useState(true);

  useEffect(() => {
    Promise.all([
      fetch(`${API_URL}/tournaments`).then(r => r.json()),
      fetch(`${API_URL}/events`).then(r => r.json()),
      fetch(`${API_URL}/players`).then(r => r.json()),
      fetch(`${API_URL}/teams`).then(r => r.json()),
    ]).then(([ts, es, ps, tms]) => {
      setTournaments(Array.isArray(ts) ? ts : []);
      setStats({
        tournaments: Array.isArray(ts) ? ts.length : 0,
        events:      Array.isArray(es) ? es.length : 0,
        players:     Array.isArray(ps) ? ps.length : 0,
        teams:       Array.isArray(tms) ? tms.length : 0,
      });
    }).finally(() => setLoading(false));
  }, []);

  const liveOrOngoing = tournaments.filter(t => t.status === 'live' || t.status === 'ongoing');
  const recent        = tournaments.slice(0, 5);

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)' }}>
      <nav className="navbar">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center gap-4">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ width: '2rem', height: '2rem', borderRadius: '8px', background: 'var(--accent-lime)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem' }}>
              🎾
            </div>
            <div>
              <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.2 }}>Arena Beach Tennis</div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Painel do Organizador</div>
            </div>
          </div>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: '0.75rem' }}>
            <a href="/" className="btn btn-secondary btn-sm">Admin</a>
            <a href="/torneios" className="btn btn-ghost btn-sm">Torneios ↗</a>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: '2.25rem', fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 0.25rem' }}>Dashboard</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: 0 }}>Visão geral dos seus torneios</p>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
          {[
            { label: 'Torneios',  value: stats.tournaments, icon: '🏆', color: 'var(--accent-lime)' },
            { label: 'Eventos',   value: stats.events,      icon: '📋', color: 'var(--accent-blue)' },
            { label: 'Jogadores', value: stats.players,     icon: '👤', color: 'var(--accent-gold)' },
            { label: 'Duplas',    value: stats.teams,       icon: '👥', color: '#A875FF' },
          ].map(s => (
            <div key={s.label} className="stat-card">
              <div style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>{s.icon}</div>
              <div className="stat-value" style={{ color: s.color }}>{loading ? '—' : s.value}</div>
              <div className="stat-label">{s.label}</div>
            </div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
          {/* Active */}
          <div className="card" style={{ padding: '1.5rem' }}>
            <h2 style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: '1.25rem', fontWeight: 700, marginBottom: '1rem', color: 'var(--text-primary)' }}>Torneios Ativos</h2>
            {!loading && liveOrOngoing.length === 0 ? (
              <p style={{ fontSize: '0.875rem', color: 'var(--text-faint)', textAlign: 'center', padding: '1.5rem 0' }}>Nenhum torneio ativo no momento</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {(loading ? [1,2] : liveOrOngoing).map((t: any, i) => loading ? (
                  <div key={i} className="skeleton" style={{ height: '3.5rem', borderRadius: 'var(--radius-md)' }} />
                ) : (
                  <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem', background: 'var(--bg-surface)', borderRadius: 'var(--radius-md)' }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: '0.875rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.name}</div>
                      {(t.city || t.state) && <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{[t.city, t.state].filter(Boolean).join(', ')}</div>}
                    </div>
                    <span className={`badge ${(STATUS_INFO[t.status] ?? STATUS_INFO.draft).cls}`}>{(STATUS_INFO[t.status] ?? STATUS_INFO.draft).label}</span>
                    <a href={`/torneios/${t.slug}`} target="_blank" className="btn btn-ghost btn-sm" style={{ flexShrink: 0 }}>↗</a>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent */}
          <div className="card" style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <h2 style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: '1.25rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>Últimos Torneios</h2>
              <a href="/" className="btn btn-secondary btn-sm">Gerenciar →</a>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {(loading ? [1,2,3,4,5] : recent).map((t: any, i) => loading ? (
                <div key={i} style={{ padding: '0.625rem 0', borderBottom: '1px solid var(--border)' }}>
                  <div className="skeleton" style={{ height: '0.9rem', width: '60%', borderRadius: '4px', marginBottom: '0.4rem' }} />
                  <div className="skeleton" style={{ height: '0.75rem', width: '35%', borderRadius: '4px' }} />
                </div>
              ) : (
                <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.625rem 0', borderBottom: '1px solid var(--border)' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: '0.875rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.name}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{t.startDate?.slice(0, 10)}</div>
                  </div>
                  <span className={`badge ${(STATUS_INFO[t.status] ?? STATUS_INFO.draft).cls}`}>{(STATUS_INFO[t.status] ?? STATUS_INFO.draft).label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Quick actions */}
        <div style={{ marginTop: '2rem', padding: '1.5rem', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)' }}>
          <h2 style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: '1.25rem', fontWeight: 700, marginBottom: '1rem', color: 'var(--text-primary)' }}>Ações Rápidas</h2>
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            {[
              { href: '/',        icon: '🏆', label: 'Novo Torneio' },
              { href: '/',        icon: '👤', label: 'Cadastrar Jogador' },
              { href: '/',        icon: '👥', label: 'Formar Dupla' },
              { href: '/',        icon: '🎯', label: 'Gerar Chaveamento' },
              { href: '/torneios', icon: '📺', label: 'Ver ao Vivo' },
            ].map(a => (
              <a key={a.label} href={a.href} className="btn btn-secondary">{a.icon} {a.label}</a>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
