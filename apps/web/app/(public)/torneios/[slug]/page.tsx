'use client';

import { useCallback, useEffect, useState, use } from 'react';
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
  params: Promise<{ slug: string }>;
};

export default function TournamentDetailPage({ params }: PageProps) {
  const { slug } = use(params);
  const [bracket, setBracket] = useState<BracketData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'grupos' | 'bracket' | 'ranking'>('grupos');
  const [eventId, setEventId] = useState('');
  const [events, setEvents] = useState<any[]>([]);
  const [tournament, setTournament] = useState<any>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [ranking, setRanking] = useState<any[]>([]);

  useEffect(() => {
    async function loadTournament() {
      setLoading(true);
      setError('');

      try {
        const res = await fetch(`${API_URL}/tournaments`);
        if (!res.ok) throw new Error('Erro ao carregar torneios.');

        const tournaments = await res.json();
        const selectedTournament = Array.isArray(tournaments)
          ? tournaments.find((item: any) => item.slug === slug)
          : null;

        if (!selectedTournament) {
          setError('Torneio nao encontrado.');
          setLoading(false);
          return;
        }

        setTournament(selectedTournament);

        const eventsRes = await fetch(`${API_URL}/events?tournamentId=${selectedTournament.id}`);
        if (!eventsRes.ok) throw new Error('Erro ao carregar eventos.');

        const eventsData = await eventsRes.json();
        const tournamentEvents = Array.isArray(eventsData) ? eventsData : [];
        setEvents(tournamentEvents);

        if (tournamentEvents.length > 0) {
          setEventId(tournamentEvents[0].id);
        } else {
          setBracket(null);
          setError('Este torneio ainda nao possui eventos cadastrados.');
          setLoading(false);
        }
      } catch {
        setError('Erro ao carregar torneio.');
        setLoading(false);
      }
    }

    loadTournament();
  }, [slug]);

  const loadBracket = useCallback(async () => {
    if (!eventId) return;

    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/events/${eventId}/bracket`);
      if (!res.ok) {
        setBracket(null);
        setError('Sem chaveamento gerado.');
        return;
      }

      const data = await res.json();
      setBracket(data);
      setLastUpdated(new Date());
      setError('');
    } catch {
      setBracket(null);
      setError('Erro ao carregar chaveamento.');
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  const loadRanking = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/ranking`);
      const data = await res.json();
      setRanking(Array.isArray(data) ? data : []);
    } catch {
      setRanking([]);
    }
  }, []);

  useEffect(() => {
    loadBracket();
    loadRanking();
  }, [loadBracket, loadRanking]);

  useEffect(() => {
    if (!eventId) return;

    const interval = setInterval(() => {
      loadBracket();
    }, 30000);

    return () => clearInterval(interval);
  }, [eventId, loadBracket]);

  const statusColors: Record<string, string> = {
    live: 'bg-red-500/20 text-red-400 border-red-500/40',
    finished: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40',
    open: 'bg-blue-500/20 text-blue-400 border-blue-500/40',
    draft: 'bg-slate-600/30 text-slate-400 border-slate-500/40',
  };

  const statusLabel: Record<string, string> = {
    live: 'Ao Vivo',
    finished: 'Finalizado',
    open: 'Inscricoes Abertas',
    draft: 'Rascunho',
  };

  return (
    <div className="min-h-screen bg-slate-950">
      <nav className="sticky top-0 z-50 bg-slate-900/95 backdrop-blur-sm border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center gap-4">
          <a href="/torneios" className="text-slate-400 hover:text-white transition-colors text-sm">
            Voltar para torneios
          </a>
          <div className="h-4 w-px bg-slate-700" />
          <span className="text-slate-200 font-semibold truncate">
            {tournament?.name ?? slug}
          </span>
          {bracket?.event && (
            <span className={`ml-auto text-xs px-2.5 py-1 rounded-full border ${statusColors[bracket.event.status] ?? statusColors.draft}`}>
              {statusLabel[bracket.event.status] ?? bracket.event.status}
            </span>
          )}
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {tournament && (
          <div className="mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-2">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-white">{tournament.name}</h1>
                <p className="text-slate-400 text-sm mt-0.5">
                  {[tournament.city, tournament.state, tournament.country].filter(Boolean).join(' - ') || 'Local nao definido'} -{' '}
                  {tournament.startDate?.slice(0, 10)} ate {tournament.endDate?.slice(0, 10)}
                </p>
              </div>
            </div>

            {events.length > 1 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {events.map((eventItem) => (
                  <button
                    key={eventItem.id}
                    type="button"
                    onClick={() => setEventId(eventItem.id)}
                    className={`text-sm px-3 py-1.5 rounded-lg border transition-all ${
                      eventId === eventItem.id
                        ? 'bg-green-600 border-green-500 text-white'
                        : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
                    }`}
                  >
                    {eventItem.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {bracket?.champion && (
          <div className="mb-6 relative overflow-hidden">
            <div className="champion-glow bg-gradient-to-r from-yellow-950 via-amber-900/60 to-yellow-950 border border-yellow-600/50 rounded-2xl p-6 text-center">
              <div className="trophy-bounce text-5xl mb-2">TROFEU</div>
              <div className="text-yellow-400 text-xs font-bold uppercase tracking-[0.3em] mb-2">Campeao do Torneio</div>
              <div className="text-white text-2xl sm:text-3xl font-black">{bracket.champion.label}</div>
              <div className="mt-3 flex items-center justify-center gap-4 text-sm text-yellow-600">
                <span>{bracket.event.name}</span>
                {bracket.event.category && <span>{bracket.event.category}</span>}
              </div>
            </div>
          </div>
        )}

        <div className="flex gap-1 bg-slate-900 rounded-xl p-1 mb-6 border border-slate-800">
          {[
            { key: 'grupos', label: 'Fase de Grupos', show: bracket?.isGroupPhase ?? true },
            { key: 'bracket', label: 'Mata-Mata', show: true },
            { key: 'ranking', label: 'Ranking', show: true },
          ]
            .filter((tab) => tab.show)
            .map((tab) => (
              <button
                key={tab.key}
                type="button"
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

        {loading && (
          <div className="text-center py-16">
            <div className="inline-block w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full animate-spin mb-3" />
            <p className="text-slate-400">Carregando chaveamento...</p>
          </div>
        )}

        {error && !loading && (
          <div className="text-center py-16">
            <p className="text-slate-400 text-lg">{error}</p>
            {eventId && (
              <button
                type="button"
                onClick={loadBracket}
                className="mt-4 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm transition-colors"
              >
                Tentar novamente
              </button>
            )}
          </div>
        )}

        {!loading && !error && bracket && (
          <>
            {activeTab === 'grupos' && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold text-slate-200">Fase de Grupos</h2>
                  <button
                    type="button"
                    onClick={loadBracket}
                    className="text-xs text-slate-400 hover:text-white flex items-center gap-1.5 transition-colors"
                  >
                    Atualizar
                    {lastUpdated && (
                      <span className="text-slate-600">
                        {lastUpdated.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </span>
                    )}
                  </button>
                </div>
                <GroupStandings groups={bracket.groups} apiUrl={API_URL} onRefresh={loadBracket} />
              </div>
            )}

            {activeTab === 'bracket' && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold text-slate-200">Chave Eliminatoria</h2>
                  <button
                    type="button"
                    onClick={loadBracket}
                    className="text-xs text-slate-400 hover:text-white flex items-center gap-1.5 transition-colors"
                  >
                    Atualizar
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

            {activeTab === 'ranking' && (
              <div>
                <h2 className="text-lg font-bold text-slate-200 mb-4">Ranking Geral de Jogadores</h2>
                {ranking.length === 0 ? (
                  <p className="text-slate-500 text-center py-12">Nenhuma pontuacao registrada ainda.</p>
                ) : (
                  <div className="bg-slate-900 rounded-xl border border-slate-700/60 overflow-hidden">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-xs text-slate-500 border-b border-slate-800">
                          <th className="px-4 py-3 text-left">#</th>
                          <th className="px-4 py-3 text-left">Jogador</th>
                          <th className="px-4 py-3 text-left">Pais</th>
                          <th className="px-4 py-3 text-right">Pontos</th>
                        </tr>
                      </thead>
                      <tbody>
                        {ranking.map((item) => (
                          <tr key={item.playerId} className="border-b border-slate-800/50 hover:bg-slate-800/20 transition-colors">
                            <td className="px-4 py-3">{item.position}</td>
                            <td className="px-4 py-3 font-medium text-slate-200">{item.name}</td>
                            <td className="px-4 py-3 text-slate-400">{item.nationality ?? 'BR'}</td>
                            <td className="px-4 py-3 text-right font-bold text-emerald-400">{item.points.toLocaleString('pt-BR')}</td>
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
      </main>
    </div>
  );
}
