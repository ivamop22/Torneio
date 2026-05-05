'use client';

import dynamic from 'next/dynamic';
import { useCallback, useEffect, useState } from 'react';
import { Toast } from '../components/ui/Toast';
import { useAuth } from '../contexts/AuthContext';

const TabFallback = () => (
  <div className="card p-6 flex items-center gap-3 text-sm" style={{ color: 'var(--text-muted)' }}>
    <span className="spinner" />
    Carregando módulo...
  </div>
);

const TournamentsTab = dynamic(
  () => import('../components/admin/TournamentsTab').then((mod) => mod.TournamentsTab),
  { ssr: false, loading: TabFallback },
);
const EventsTab = dynamic(
  () => import('../components/admin/EventsTab').then((mod) => mod.EventsTab),
  { ssr: false, loading: TabFallback },
);
const PlayersTab = dynamic(
  () => import('../components/admin/PlayersTab').then((mod) => mod.PlayersTab),
  { ssr: false, loading: TabFallback },
);
const TeamsTab = dynamic(
  () => import('../components/admin/TeamsTab').then((mod) => mod.TeamsTab),
  { ssr: false, loading: TabFallback },
);
const DrawTab = dynamic(
  () => import('../components/admin/DrawTab').then((mod) => mod.DrawTab),
  { ssr: false, loading: TabFallback },
);

type Tournament = { id: string; name: string; slug: string; status: string; city?: string | null; state?: string | null; startDate: string; endDate: string };
type EventItem  = { id: string; tournamentId: string; name: string; gender: string; format: string; category?: string | null; status: string };
type Player     = { id: string; fullName: string; gender?: string | null; email?: string | null; rankingPoints: number };
type Team       = { id: string; seed?: number | null; status: string; player1?: { id: string; fullName: string } | null; player2?: { id: string; fullName: string } | null };

type Tab = 'torneios' | 'eventos' | 'jogadores' | 'duplas' | 'chaveamento';

const TABS: { key: Tab; icon: string; label: string }[] = [
  { key: 'torneios',    icon: '🏆', label: 'Torneios'    },
  { key: 'eventos',     icon: '📋', label: 'Eventos'     },
  { key: 'jogadores',   icon: '👤', label: 'Jogadores'   },
  { key: 'duplas',      icon: '👥', label: 'Duplas'       },
  { key: 'chaveamento', icon: '🎯', label: 'Chaveamento' },
];

async function parseApiResponse<T>(response: Response): Promise<T> {
  const text = await response.text();
  const data = text ? JSON.parse(text) : null;

  if (!response.ok) {
    const message = data?.message || `HTTP ${response.status}`;
    throw new Error(message);
  }

  return data as T;
}

export default function AdminPage() {
  const { user, logout, authFetch } = useAuth();
  const [tab, setTab] = useState<Tab>(() => {
    if (typeof window === 'undefined') return 'torneios';
    const t = new URLSearchParams(window.location.search).get('tab') as Tab;
    return (['torneios', 'eventos', 'jogadores', 'duplas', 'chaveamento'] as Tab[]).includes(t) ? t : 'torneios';
  });
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [events, setEvents]       = useState<EventItem[]>([]);
  const [players, setPlayers]     = useState<Player[]>([]);
  const [teams, setTeams]         = useState<Team[]>([]);
  const [loading, setLoading]     = useState(true);
  const [toast, setToast]         = useState('');
  const [toastType, setToastType] = useState<'ok' | 'err'>('ok');

  const showMsg = useCallback((msg: string, type: 'ok' | 'err' = 'ok') => {
    setToast(msg);
    setToastType(type);
  }, []);

  const apiRequest = useCallback(async (url: string, method: string, body?: any) => {
    const response = await authFetch(url, {
      method,
      body: body ? JSON.stringify(body) : undefined,
    });

    if (response.status === 204) return null;
    return parseApiResponse(response);
  }, [authFetch]);

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [ts, es, ps, tms] = await Promise.all([
        authFetch('/tournaments').then((r) => parseApiResponse<Tournament[]>(r)),
        authFetch('/events').then((r) => parseApiResponse<EventItem[]>(r)),
        authFetch('/players').then((r) => parseApiResponse<Player[]>(r)),
        authFetch('/teams').then((r) => parseApiResponse<Team[]>(r)),
      ]);
      setTournaments(Array.isArray(ts) ? ts : []);
      setEvents(Array.isArray(es) ? es : []);
      setPlayers(Array.isArray(ps) ? ps : []);
      setTeams(Array.isArray(tms) ? tms : []);
    } catch (err: any) {
      showMsg(err.message || 'Erro ao conectar com a API', 'err');
    } finally {
      setLoading(false);
    }
  }, [showMsg, authFetch]);

  useEffect(() => { loadAll(); }, [loadAll]);

  const tabProps = { apiRequest, onRefresh: loadAll, showMsg };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)' }}>
      {/* Navbar */}
      <nav className="navbar">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-lg" style={{ background: 'var(--accent-lime)' }}>
              🎾
            </div>
            <div>
              <div className="font-display text-base font-bold tracking-wide" style={{ color: 'var(--text-primary)', lineHeight: 1.2 }}>
                Arena Beach Tennis
              </div>
              <div className="text-xs" style={{ color: 'var(--text-muted)' }}>Painel do Organizador</div>
            </div>
          </div>

          {/* Stats */}
          <div className="hidden md:flex items-center gap-4 ml-6">
            {[
              { label: 'Torneios', value: tournaments.length },
              { label: 'Jogadores', value: players.length },
              { label: 'Duplas', value: teams.length },
            ].map(s => (
              <div key={s.label} className="flex items-center gap-1.5 text-sm">
                <span className="font-display text-lg font-bold" style={{ color: 'var(--accent-lime)' }}>{s.value}</span>
                <span style={{ color: 'var(--text-muted)' }}>{s.label}</span>
              </div>
            ))}
          </div>

          <div className="ml-auto flex items-center gap-2">
            {user?.role === 'superuser' && (
              <a href="/superuser" className="btn btn-secondary btn-sm">Superusuário</a>
            )}
            <a href="/ajuda" className="btn btn-secondary btn-sm">📖 Manual</a>
            <a href="/torneios" target="_blank" className="btn btn-secondary btn-sm">
              Ver ao vivo ↗
            </a>
            {user && (
              <button onClick={logout} className="btn btn-secondary btn-sm" title={user.email}>
                Sair ({user.name.split(' ')[0]})
              </button>
            )}
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {/* Tabs */}
        <div className="tab-list mb-6">
          {TABS.map(t => (
            <button
              key={t.key}
              className={`tab-item ${tab === t.key ? 'active' : ''}`}
              onClick={() => setTab(t.key)}
            >
              <span>{t.icon}</span>
              <span className="tab-label">{t.label}</span>
            </button>
          ))}
        </div>

        {/* Loading */}
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '5rem 0', gap: '1rem' }}>
            <span className="spinner" style={{ width: '2rem', height: '2rem', borderWidth: '3px' }} />
            <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Carregando dados...</span>
          </div>
        ) : (
          <>
            {tab === 'torneios'    && <TournamentsTab tournaments={tournaments} {...tabProps} />}
            {tab === 'eventos'     && <EventsTab events={events} tournaments={tournaments} {...tabProps} />}
            {tab === 'jogadores'   && <PlayersTab players={players} {...tabProps} />}
            {tab === 'duplas'      && <TeamsTab tournaments={tournaments} events={events} players={players} teams={teams} {...tabProps} />}
            {tab === 'chaveamento' && <DrawTab events={events} tournaments={tournaments} {...tabProps} />}
          </>
        )}
      </div>

      <Toast message={toast} type={toastType} onClose={() => setToast('')} />
    </div>
  );
}
