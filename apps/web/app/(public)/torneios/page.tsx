'use client';

import { useEffect, useState } from 'react';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

type Tournament = {
  id: string;
  name: string;
  slug: string;
  status: string;
  city?: string | null;
  state?: string | null;
  startDate: string;
  endDate: string;
  level: string;
};

const STATUS_INFO: Record<string, { label: string; cls: string; dot: string }> = {
  live:      { label: 'Ao Vivo',      cls: 'badge-live',      dot: '#FF4060' },
  finished:  { label: 'Finalizado',   cls: 'badge-done',      dot: '#00C850' },
  open:      { label: 'Inscrições',   cls: 'badge-open',      dot: '#3D9EFF' },
  ongoing:   { label: 'Em Andamento', cls: 'badge-ongoing',   dot: '#FFD14A' },
  draft:     { label: 'Em breve',     cls: 'badge-draft',     dot: '#3A4E72' },
  published: { label: 'Publicado',    cls: 'badge-published', dot: '#A875FF' },
  cancelled: { label: 'Cancelado',    cls: 'badge-cancelled', dot: '#FF4060' },
};

const LEVEL_LABEL: Record<string, string> = {
  official:     'Oficial',
  federated:    'Federado',
  recreational: 'Recreativo',
  training:     'Treino',
};

function formatDate(d: string) {
  return new Date(d + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
}

function TournamentCard({ t }: { t: Tournament }) {
  const info = STATUS_INFO[t.status] ?? STATUS_INFO.draft;
  const isLive = t.status === 'live';

  return (
    <a
      href={`/torneios/${t.slug}`}
      style={{
        display: 'block',
        background: 'var(--bg-card)',
        border: `1px solid ${isLive ? 'rgba(255,64,96,0.4)' : 'var(--border)'}`,
        borderRadius: 'var(--radius-lg)',
        padding: '1.25rem',
        textDecoration: 'none',
        transition: 'var(--transition)',
        position: 'relative',
        overflow: 'hidden',
      }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLElement).style.borderColor = isLive ? 'rgba(255,64,96,0.7)' : 'var(--border-glow)';
        (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)';
        (e.currentTarget as HTMLElement).style.boxShadow = isLive ? '0 8px 32px rgba(255,64,96,0.15)' : '0 8px 32px rgba(0,0,0,0.3)';
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLElement).style.borderColor = isLive ? 'rgba(255,64,96,0.4)' : 'var(--border)';
        (e.currentTarget as HTMLElement).style.transform = '';
        (e.currentTarget as HTMLElement).style.boxShadow = '';
      }}
    >
      {/* Live glow strip */}
      {isLive && (
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: '2px',
          background: 'linear-gradient(90deg, transparent, var(--accent-red), transparent)',
        }} />
      )}

      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.75rem', marginBottom: '0.875rem' }}>
        <h2 style={{
          fontFamily: 'Barlow Condensed, sans-serif',
          fontSize: '1.2rem',
          fontWeight: 700,
          color: 'var(--text-primary)',
          lineHeight: 1.25,
          flex: 1,
          margin: 0,
        }}>
          {t.name}
        </h2>
        <span className={`badge ${info.cls}`} style={{ flexShrink: 0 }}>
          {isLive && (
            <span className="live-dot" style={{ display: 'inline-block', width: '6px', height: '6px', borderRadius: '50%', background: info.dot, marginRight: '4px' }} />
          )}
          {info.label}
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem', marginBottom: '1rem' }}>
        {(t.city || t.state) && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            <span>📍</span>
            <span>{[t.city, t.state].filter(Boolean).join(', ')}</span>
          </div>
        )}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          <span>📅</span>
          <span>{formatDate(t.startDate)} — {formatDate(t.endDate)}</span>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-faint)' }}>
          {LEVEL_LABEL[t.level] ?? t.level}
        </span>
        <span style={{ fontSize: '0.75rem', color: 'var(--accent-lime)', fontWeight: 600 }}>
          Ver chaveamento →
        </span>
      </div>
    </a>
  );
}

function SkeletonCard() {
  return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '1.25rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
        <div className="skeleton" style={{ height: '1.25rem', width: '60%', borderRadius: '4px' }} />
        <div className="skeleton" style={{ height: '1.25rem', width: '5rem', borderRadius: '99px' }} />
      </div>
      <div className="skeleton" style={{ height: '0.875rem', width: '40%', borderRadius: '4px', marginBottom: '0.5rem' }} />
      <div className="skeleton" style={{ height: '0.875rem', width: '55%', borderRadius: '4px', marginBottom: '1rem' }} />
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <div className="skeleton" style={{ height: '0.75rem', width: '4rem', borderRadius: '4px' }} />
        <div className="skeleton" style={{ height: '0.75rem', width: '7rem', borderRadius: '4px' }} />
      </div>
    </div>
  );
}

export default function TournamentsListPage() {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading]         = useState(true);
  const [filter, setFilter]           = useState<string>('all');

  useEffect(() => {
    fetch(`${API_URL}/tournaments`)
      .then(r => r.json())
      .then(data => { setTournaments(Array.isArray(data) ? data : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const live = tournaments.filter(t => t.status === 'live');
  const filtered = filter === 'all'
    ? tournaments
    : tournaments.filter(t => t.status === filter);

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)' }}>
      {/* Navbar */}
      <nav className="navbar">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center gap-4">
          <a href="/" style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', textDecoration: 'none' }}>
            <div style={{ width: '2rem', height: '2rem', borderRadius: '8px', background: 'var(--accent-lime)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem' }}>
              🎾
            </div>
            <span style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '0.02em' }}>
              Arena Beach Tennis
            </span>
          </a>
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <a href="/" className="btn btn-secondary btn-sm">Admin →</a>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Hero */}
        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 'clamp(2rem, 5vw, 3.5rem)', fontWeight: 900, lineHeight: 1.05, color: 'var(--text-primary)', margin: '0 0 0.5rem 0' }}>
            Torneios de<br />
            <span style={{ color: 'var(--accent-lime)' }}>Beach Tennis</span>
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '1rem', margin: 0 }}>
            Resultados, chaveamento e ranking em tempo real
          </p>
        </div>

        {/* Live alert */}
        {live.length > 0 && !loading && (
          <div style={{
            background: 'rgba(255,64,96,0.08)',
            border: '1px solid rgba(255,64,96,0.3)',
            borderRadius: 'var(--radius-lg)',
            padding: '0.875rem 1.25rem',
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
          }}>
            <span className="live-dot" style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', background: 'var(--accent-red)', flexShrink: 0 }} />
            <span style={{ color: '#FF6080', fontWeight: 600, fontSize: '0.875rem' }}>
              {live.length === 1
                ? `"${live[0].name}" está acontecendo agora`
                : `${live.length} torneios acontecendo agora`}
            </span>
            <a href={`/torneios/${live[0].slug}`} className="btn btn-sm" style={{ marginLeft: 'auto', background: 'rgba(255,64,96,0.15)', color: '#FF6080', border: '1px solid rgba(255,64,96,0.3)' }}>
              Acompanhar →
            </a>
          </div>
        )}

        {/* Filters */}
        {!loading && tournaments.length > 0 && (
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
            {[
              { key: 'all',      label: `Todos (${tournaments.length})` },
              { key: 'live',     label: 'Ao Vivo' },
              { key: 'ongoing',  label: 'Em Andamento' },
              { key: 'open',     label: 'Inscrições' },
              { key: 'finished', label: 'Finalizados' },
            ].map(f => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                style={{
                  padding: '0.375rem 0.875rem',
                  borderRadius: '99px',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  border: `1px solid ${filter === f.key ? 'var(--accent-lime)' : 'var(--border)'}`,
                  background: filter === f.key ? 'rgba(180,255,61,0.12)' : 'var(--bg-surface)',
                  color: filter === f.key ? 'var(--accent-lime)' : 'var(--text-muted)',
                  transition: 'var(--transition)',
                }}
              >
                {f.label}
              </button>
            ))}
          </div>
        )}

        {/* Grid */}
        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
            {[1,2,3,4,5,6].map(n => <SkeletonCard key={n} />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <span className="empty-state-icon">🎾</span>
            <p style={{ fontWeight: 600, fontSize: '1rem' }}>Nenhum torneio encontrado</p>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-faint)', margin: 0 }}>
              {filter !== 'all' ? 'Tente outro filtro' : 'Nenhum torneio cadastrado ainda'}
            </p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
            {filtered.map(t => <TournamentCard key={t.id} t={t} />)}
          </div>
        )}
      </main>

      <footer style={{ borderTop: '1px solid var(--border)', padding: '2rem 0', marginTop: '4rem', textAlign: 'center', color: 'var(--text-faint)', fontSize: '0.8rem' }}>
        Arena Beach Tennis Platform
      </footer>
    </div>
  );
}
