'use client';

import { useCallback, useEffect, useState } from 'react';
import { TournamentBracket } from '../../../../components/TournamentBracket';
import { GroupStandings } from '../../../../components/GroupStandings';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

type BracketData = {
  event: {
    id: string;
    name: string;
    gender: string;
    format: string;
    category: string | null;
    status: string;
  };
  groups: any[];
  knockout: Record<string, any[]>;
  knockoutRoundOrder: string[];
  champion: any | null;
  isGroupPhase: boolean;
  isKnockoutPhase: boolean;
};

type PageProps = {
  params: { slug: string };
};

export default function TournamentDetailPage({ params }: PageProps) {
  const [bracket, setBracket] = useState<BracketData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'grupos' | 'bracket' | 'ranking'>('grupos');
  const [eventId, setEventId] = useState<string>('');
  const [events, setEvents] = useState<any[]>([]);
  const [tournament, setTournament] = useState<any>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [ranking, setRanking] = useState<any[]>([]);

  // Buscar torneio pelo slug
  useEffect(() => {
    async function loadTournament() {
      try {
        const res = await fetch(`${API_URL}/tournaments`);
        const tournaments = await res.json();
        const t = tournaments.find((t: any) => t.slug === params.slug);
        if (!t) { setError('Torneio não encontrado.'); setLoading(false); return; }
        setTournament(t);

        // Buscar eventos do torneio
        const evRes = await fetch(`${API_URL}/events?tournamentId=${t.id}`);
        const evData = await evRes.json();
        setEvents(evData);
        if (evData.length > 0) setEventId(evData[0].id);
      } catch {
        setError('Erro ao carregar torneio.');
      }
    }
    loadTournament();
  }, [params.slug]);

  const loadBracket = useCallback(async () => {
    if (!eventId) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/events/${eventId}/bracket`);
      if (!res.ok) { setError('Sem chaveamento gerado.'); setLoading(false); return; }
      const data = await res.json();
      setBracket(data);
      setLastUpdated(new Date());
      setError('');
    } catch {
      setError('Erro ao carregar chaveamento.');
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  const loadRanking = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/ranking`);
      const data = await res.json();
      setRanking(data);
    } catch {}
  }, []);

  useEffect(() => {
    loadBracket();
    loadRanking();
  }, [loadBracket, loadRanking]);

  // Auto-refresh a cada 30s
  useEffect(() => {
    const interval = setInterval(() => {
      loadBracket();
    }, 30000);
    return () => clearInterval(interval);
  }, [loadBracket]);

  const statusColors: Record<string, string> = {
    live: 'bg-red-500/20 text-red-400 border-red-500/40',
    finished: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40',
    open: 'bg-blue-500/20 text-blue-400 border-blue-500/40',
    draft: 'bg-slate-600/30 text-slate-400 border-slate-500/40',
  };

  const statusLabel: Record<string, string> = {
    live: '🔴 Ao Vivo',
    finished: '✅ Finalizado',
    open: '📋 Inscrições Abertas',
    draft: '📝 Rascunho',
  };

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 bg-slate-900/95 backdrop-blur-sm border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center gap-4">
          <a href="/torneios" className="text-slate-400 hover:text-white transition-colors text-sm">
            ← Torneios
          </a>
          <div className="h-4 w-px bg-slate-700" />
          <span className="text-slate-200 font-semibold truncate">
            {tournament?.name ?? params.slug}
          </span>
          {bracket?.event && (
            <span className={`ml-auto text-xs px-2.5 py-1 rounded-full border ${statusColors[bracket.event.status] ?? statusColors.draft}`}>
              {statusLabel[bracket.event.status] ?? bracket.event.status}
            </span>
          )}
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {/* Header do torneio */}
        {tournament && (
          <div className="mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-2">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-white">{tournament.name}</h1>
                <p className="text-slate-400 text-sm mt-0.5">
                  {[tournament.city, tournament.state, tournament.country].filter(Boolean).join(' • ')} •{' '}
                  {tournament.startDate?.slice(0, 10)} → {tournament.endDate?.slice(0, 10)}
                </p>
              </div>
            </div>

            {/* Seletor de evento */}
            {events.length > 1 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {events.map((ev) => (
                  <button
                    key={ev.id}
                    onClick={() => setEventId(ev.id)}
                    className={`text-sm px-3 py-1.5 rounded-lg border transition-all ${
                      eventId === ev.id
                        ? 'bg-primary-600 border-primary-500 text-white'
                        : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
                    }`}
                  >
                    {ev.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Campeão destacado (topo) */}
        {bracket?.champion && (
          <div className="mb-6 relative overflow-hidden">
            <div className="champion-glow bg-gradient-to-r from-yellow-950 via-amber-900/60 to-yellow-950 border border-yellow-600/50 rounded-2xl p-6 text-center">
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(251,191,36,0.1)_0%,transparent_70%)] pointer-events-none" />
              <div className="trophy-bounce text-5xl mb-2">🏆</div>
              <div className="text-yellow-400 text-xs font-bold uppercase tracking-[0.3em] mb-2">Campeão do Torneio</div>
              <div className="text-white text-2xl sm:text-3xl font-black">{bracket.champion.label}</div>
              <div className="mt-3 flex items-center justify-center gap-4 text-sm text-yellow-600">
                <span>★ {bracket.event.name}</span>
                {bracket.event.category && <span>• {bracket.event.category}</span>}
              </div>
            </div>
          </div>
        )}

        {/* Tabs de navegação */}
        <div className="flex gap-1 bg-slate-900 rounded-xl p-1 mb-6 border border-slate-800">
          {[
            { key: 'grupos', label: '📊 Fase de Grupos', show: bracket?.isGroupPhase ?? true },
            { key: 'bracket', label: '🎯 Mata-Mata', show: true },
            { key: 'ranking', label: '🏅 Ranking', show: true },
          ]
            .filter((t) => t.show)
            .map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`flex-1 text-sm py-2 px-3 rounded-lg font-medium transition-all ${
                  activeTab === tab.key
                    ? 'bg-slate-700 text-white shadow-sm'
                    : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
        </div>

        {/* Status / Loading */}
        {loading && (
          <div className="text-center py-16">
            <div className="inline-block w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin mb-3" />
            <p className="text-slate-400">Carregando chaveamento...</p>
          </div>
        )}

        {error && !loading && (
          <div className="text-center py-16">
            <div className="text-4xl mb-3">🎾</div>
            <p className="text-slate-400 text-lg">{error}</p>
            <button
              onClick={loadBracket}
              className="mt-4 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm transition-colors"
            >
              Tentar novamente
            </button>
          </div>
        )}

        {!loading && !error && bracket && (
          <>
            {/* FASE DE GRUPOS */}
            {activeTab === 'grupos' && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold text-slate-200">Fase de Grupos</h2>
                  <button
                    onClick={loadBracket}
                    className="text-xs text-slate-400 hover:text-white flex items-center gap-1.5 transition-colors"
                  >
                    ↻ Atualizar
                    {lastUpdated && (
                      <span className="text-slate-600">
                        {lastUpdated.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </span>
                    )}
                  </button>
                </div>
                <GroupStandings
                  groups={bracket.groups}
                  apiUrl={API_URL}
                  onRefresh={loadBracket}
                />
              </div>
            )}

            {/* MATA-MATA BRACKET */}
            {activeTab === 'bracket' && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold text-slate-200">Chave Eliminatória</h2>
                  <button
                    onClick={loadBracket}
                    className="text-xs text-slate-400 hover:text-white flex items-center gap-1.5 transition-colors"
                  >
                    ↻ Atualizar
                  </button>
                </div>
                <TournamentBracket
                  knockout={bracket.knockout}
                  roundOrder={bracket.knockoutRoundOrder}
                  champion={bracket.champion}
                  apiUrl={API_URL}
                  onRefresh={loadBracket}
                />
              </div>
            )}

            {/* RANKING */}
            {activeTab === 'ranking' && (
              <div>
                <h2 className="text-lg font-bold text-slate-200 mb-4">Ranking Geral de Jogadores</h2>
                {ranking.length === 0 ? (
                  <p className="text-slate-500 text-center py-12">Nenhuma pontuação registrada ainda.</p>
                ) : (
                  <div className="bg-slate-900 rounded-xl border border-slate-700/60 overflow-hidden">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-xs text-slate-500 border-b border-slate-800">
                          <th className="px-4 py-3 text-left">#</th>
                          <th className="px-4 py-3 text-left">Jogador</th>
                          <th className="px-4 py-3 text-left">País</th>
                          <th className="px-4 py-3 text-right">Pontos</th>
                        </tr>
                      </thead>
                      <tbody>
                        {ranking.map((r) => (
                          <tr key={r.playerId} className="border-b border-slate-800/50 hover:bg-slate-800/20 transition-colors">
                            <td className="px-4 py-3">
                              <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold ${
                                r.position === 1
                                  ? 'bg-yellow-500/20 text-yellow-400'
                                  : r.position === 2
                                  ? 'bg-slate-600/40 text-slate-300'
                                  : r.position === 3
                                  ? 'bg-amber-800/30 text-amber-500'
                                  : 'bg-slate-800 text-slate-500'
                              }`}>
                                {r.position}
                              </span>
                            </td>
                            <td className="px-4 py-3 font-medium text-slate-200">{r.name}</td>
                            <td className="px-4 py-3 text-slate-400">{r.nationality ?? 'BR'}</td>
                            <td className="px-4 py-3 text-right font-bold text-emerald-400">{r.points.toLocaleString('pt-BR')}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {/* Footer com link de auto-refresh */}
        <div className="mt-8 text-center text-xs text-slate-600">
          Atualização automática a cada 30 segundos •{' '}
          <button onClick={loadBracket} className="hover:text-slate-400 transition-colors">
            Atualizar agora
          </button>
        </div>
      </main>
    </div>
  );
}
