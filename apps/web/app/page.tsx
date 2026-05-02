'use client';

import { useCallback, useEffect, useState } from 'react';
import { TournamentsTab } from '../components/admin/TournamentsTab';
import { EventsTab }      from '../components/admin/EventsTab';
import { PlayersTab }     from '../components/admin/PlayersTab';
import { TeamsTab }       from '../components/admin/TeamsTab';
import { DrawTab }        from '../components/admin/DrawTab';
import { Toast }          from '../components/ui/Toast';
import { useAuth }        from '../contexts/AuthContext';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

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

export default function AdminPage() {
  const { user, token, logout, authFetch } = useAuth();
  const [tab, setTab]             = useState<Tab>('torneios');
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
    const r = await authFetch(url, {
      method,
      body: body ? JSON.stringify(body) : undefined,
    });
    if (!r.ok) {
      const err = await r.json().catch(() => ({ message: 'Erro desconhecido' }));
      throw new Error(err.message || `HTTP ${r.status}`);
    }
    if (r.status === 204) return null;
    const text = await r.text();
    return text ? JSON.parse(text) : null;
  }, [authFetch]);

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [ts, es, ps, tms] = await Promise.all([
        authFetch('/tournaments').then(r => r.json()),
        authFetch('/events').then(r => r.json()),
        authFetch('/players').then(r => r.json()),
        authFetch('/teams').then(r => r.json()),
      ]);
      setTournaments(Array.isArray(ts) ? ts : []);
      setEvents(Array.isArray(es) ? es : []);
      setPlayers(Array.isArray(ps) ? ps : []);
      setTeams(Array.isArray(tms) ? tms : []);
    } catch {
      showMsg('Erro ao conectar com a API', 'err');
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
            {tab === 'duplas'      && <TeamsTab events={events} players={players} teams={teams} {...tabProps} />}
            {tab === 'chaveamento' && <DrawTab events={events} tournaments={tournaments} {...tabProps} />}
          </>
        )}
      </div>

      <Toast message={toast} type={toastType} onClose={() => setToast('')} />
    </div>
  );
}
