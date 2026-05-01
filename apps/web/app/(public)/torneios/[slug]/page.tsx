'use client';

import { FormEvent, useCallback, useEffect, useMemo, useState, use } from 'react';
import { TournamentBracket } from '../../../../components/TournamentBracket';
import { GroupStandings } from '../../../../components/GroupStandings';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

const MODALITIES = [
  { value: 'male', label: 'Masculino' },
  { value: 'female', label: 'Feminino' },
  { value: 'mixed', label: 'Mista' },
] as const;
const AGE_GROUPS = [
  { value: 'infantil', label: 'Infantil' },
  { value: 'junior', label: 'Junior' },
  { value: 'adulto', label: 'Adulto' },
] as const;
const CLASS_LEVELS = ['A', 'B', 'C', 'D'] as const;

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

type ActiveTab = 'inscricao' | 'grupos' | 'bracket' | 'ranking' | 'desempenho';

export default function TournamentDetailPage({ params }: PageProps) {
  const { slug } = use(params);
  const [bracket, setBracket] = useState<BracketData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<ActiveTab>('inscricao');
  const [eventId, setEventId] = useState('');
  const [events, setEvents] = useState<any[]>([]);
  const [tournament, setTournament] = useState<any>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [ranking, setRanking] = useState<any[]>([]);
  const [registrationMessage, setRegistrationMessage] = useState('');
  const [registrationError, setRegistrationError] = useState('');
  const [registering, setRegistering] = useState(false);
  const [registeredPlayerId, setRegisteredPlayerId] = useState('');
  const [performance, setPerformance] = useState<any>(null);

  const [athleteName, setAthleteName] = useState('');
  const [athleteGender, setAthleteGender] = useState('male');
  const [athleteEmail, setAthleteEmail] = useState('');
  const [athletePhone, setAthletePhone] = useState('');
  const [partnerName, setPartnerName] = useState('');
  const [partnerGender, setPartnerGender] = useState('female');
  const [partnerEmail, setPartnerEmail] = useState('');
  const [modality, setModality] = useState('mixed');
  const [ageGroup, setAgeGroup] = useState('adulto');
  const [classLevel, setClassLevel] = useState('C');

  const selectedEvent = useMemo(
    () => events.find((eventItem) => eventItem.id === eventId),
    [events, eventId],
  );

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
          setLoading(false);
        }
      } catch {
        setError('Erro ao carregar torneio.');
        setLoading(false);
      }
    }

    loadTournament();
  }, [slug]);

  const refreshEvents = useCallback(async () => {
    if (!tournament?.id) return;
    const eventsRes = await fetch(`${API_URL}/events?tournamentId=${tournament.id}`);
    const eventsData = await eventsRes.json();
    const tournamentEvents = Array.isArray(eventsData) ? eventsData : [];
    setEvents(tournamentEvents);
    if (!eventId && tournamentEvents.length > 0) setEventId(tournamentEvents[0].id);
  }, [tournament?.id, eventId]);

  const loadBracket = useCallback(async () => {
    if (!eventId) return;

    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/events/${eventId}/bracket`);
      if (!res.ok) {
        setBracket(null);
        setError('Sem chaveamento gerado para esta modalidade.');
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

  const loadPerformance = useCallback(async (playerId: string) => {
    if (!playerId) return;
    const res = await fetch(`${API_URL}/players/${playerId}/performance`);
    if (!res.ok) return;
    const data = await res.json();
    setPerformance(data);
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

  async function handleRegistration(event: FormEvent) {
    event.preventDefault();
    setRegistering(true);
    setRegistrationMessage('');
    setRegistrationError('');

    try {
      const res = await fetch(`${API_URL}/registrations/public`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tournamentId: tournament?.id,
          tournamentName: tournament?.name,
          athleteName,
          athleteGender,
          athleteEmail,
          athletePhone,
          partnerName,
          partnerGender,
          partnerEmail,
          modality,
          ageGroup,
          classLevel,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Erro ao inscrever atleta.');

      setRegistrationMessage(data.message || 'Inscricao confirmada.');
      setRegisteredPlayerId(data.athlete?.id ?? '');
      setPartnerName('');
      setPartnerEmail('');
      await refreshEvents();
      if (data.athlete?.id) await loadPerformance(data.athlete.id);
      setActiveTab('desempenho');
    } catch (err: any) {
      setRegistrationError(err.message || 'Erro ao inscrever atleta.');
    } finally {
      setRegistering(false);
    }
  }

  async function createDefaultEvents() {
    if (!tournament?.id) return;
    setRegistrationMessage('');
    setRegistrationError('');

    try {
      const res = await fetch(`${API_URL}/tournaments/${tournament.id}/default-events`, {
        method: 'POST',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Erro ao gerar modalidades.');
      setRegistrationMessage(`${data.count} modalidades prontas para inscricao.`);
      await refreshEvents();
    } catch (err: any) {
      setRegistrationError(err.message || 'Erro ao gerar modalidades.');
    }
  }

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

  const input = 'w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-green-500';
  const label = 'block text-xs text-slate-500 mb-1';

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
          {selectedEvent && (
            <span className={`ml-auto text-xs px-2.5 py-1 rounded-full border ${statusColors[selectedEvent.status] ?? statusColors.draft}`}>
              {statusLabel[selectedEvent.status] ?? selectedEvent.status}
            </span>
          )}
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {tournament && (
          <div className="mb-6">
            <h1 className="text-2xl sm:text-3xl font-bold text-white">{tournament.name}</h1>
            <p className="text-slate-400 text-sm mt-1">
              {[tournament.city, tournament.state, tournament.country].filter(Boolean).join(' - ') || 'Local nao definido'} -{' '}
              {tournament.startDate?.slice(0, 10)} ate {tournament.endDate?.slice(0, 10)}
            </p>

            {events.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-4">
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
              <div className="text-yellow-400 text-xs font-bold uppercase tracking-[0.3em] mb-2">Campeao do Torneio</div>
              <div className="text-white text-2xl sm:text-3xl font-black">{bracket.champion.label}</div>
              <div className="mt-3 flex items-center justify-center gap-4 text-sm text-yellow-600">
                <span>{bracket.event.name}</span>
                {bracket.event.category && <span>{bracket.event.category}</span>}
              </div>
            </div>
          </div>
        )}

        <div className="flex gap-1 bg-slate-900 rounded-xl p-1 mb-6 border border-slate-800 overflow-x-auto">
          {[
            { key: 'inscricao', label: 'Inscricao' },
            { key: 'grupos', label: 'Fase de Grupos' },
            { key: 'bracket', label: 'Mata-Mata' },
            { key: 'ranking', label: 'Ranking' },
            { key: 'desempenho', label: 'Desempenho' },
          ].map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key as ActiveTab)}
              className={`min-w-fit flex-1 text-sm py-2 px-3 rounded-lg font-medium transition-all ${
                activeTab === tab.key
                  ? 'bg-slate-700 text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {registrationMessage && (
          <div className="mb-4 rounded-lg border border-green-600/50 bg-green-900/30 px-4 py-3 text-sm text-green-200">
            {registrationMessage}
          </div>
        )}
        {registrationError && (
          <div className="mb-4 rounded-lg border border-red-700/50 bg-red-950/50 px-4 py-3 text-sm text-red-200">
            {registrationError}
          </div>
        )}

        {activeTab === 'inscricao' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <section className="lg:col-span-2 bg-slate-900 border border-slate-700/60 rounded-xl p-5">
              <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-5">
                <div>
                  <h2 className="text-lg font-bold text-slate-100">Cadastro do atleta</h2>
                  <p className="text-sm text-slate-500 mt-1">Escolha modalidade, categoria e classe para entrar no torneio.</p>
                </div>
                <button
                  type="button"
                  onClick={createDefaultEvents}
                  className="sm:ml-auto bg-slate-700 hover:bg-slate-600 text-white text-sm font-semibold rounded-lg px-4 py-2"
                >
                  Gerar modalidades
                </button>
              </div>

              <form onSubmit={handleRegistration} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className={label}>Nome do atleta *</label>
                    <input className={input} value={athleteName} onChange={(event) => setAthleteName(event.target.value)} required />
                  </div>
                  <div>
                    <label className={label}>Genero do atleta</label>
                    <select className={input} value={athleteGender} onChange={(event) => setAthleteGender(event.target.value)}>
                      <option value="male">Masculino</option>
                      <option value="female">Feminino</option>
                      <option value="other">Outro</option>
                    </select>
                  </div>
                  <div>
                    <label className={label}>E-mail</label>
                    <input className={input} type="email" value={athleteEmail} onChange={(event) => setAthleteEmail(event.target.value)} />
                  </div>
                  <div>
                    <label className={label}>Telefone</label>
                    <input className={input} value={athletePhone} onChange={(event) => setAthletePhone(event.target.value)} />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className={label}>Modalidade *</label>
                    <select className={input} value={modality} onChange={(event) => setModality(event.target.value)}>
                      {MODALITIES.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className={label}>Categoria *</label>
                    <select className={input} value={ageGroup} onChange={(event) => setAgeGroup(event.target.value)}>
                      {AGE_GROUPS.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className={label}>Classe *</label>
                    <select className={input} value={classLevel} onChange={(event) => setClassLevel(event.target.value)}>
                      {CLASS_LEVELS.map((item) => <option key={item} value={item}>Classe {item}</option>)}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 border-t border-slate-800 pt-4">
                  <div>
                    <label className={label}>Nome do parceiro</label>
                    <input className={input} value={partnerName} onChange={(event) => setPartnerName(event.target.value)} />
                  </div>
                  <div>
                    <label className={label}>Genero do parceiro</label>
                    <select className={input} value={partnerGender} onChange={(event) => setPartnerGender(event.target.value)}>
                      <option value="male">Masculino</option>
                      <option value="female">Feminino</option>
                      <option value="other">Outro</option>
                    </select>
                  </div>
                  <div>
                    <label className={label}>E-mail do parceiro</label>
                    <input className={input} type="email" value={partnerEmail} onChange={(event) => setPartnerEmail(event.target.value)} />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={registering}
                  className="w-full bg-green-600 hover:bg-green-500 disabled:opacity-60 text-white font-semibold py-3 px-4 rounded-lg transition-colors text-sm"
                >
                  {registering ? 'Enviando inscricao...' : 'Confirmar inscricao'}
                </button>
              </form>
            </section>

            <aside className="bg-slate-900 border border-slate-700/60 rounded-xl p-5">
              <h3 className="font-bold text-slate-100 mb-3">Modalidades disponiveis</h3>
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {events.length === 0 ? (
                  <p className="text-sm text-slate-500">Ainda nao ha modalidades cadastradas.</p>
                ) : (
                  events.map((eventItem) => (
                    <button
                      key={eventItem.id}
                      type="button"
                      onClick={() => { setEventId(eventItem.id); setActiveTab('grupos'); }}
                      className="w-full text-left bg-slate-800 hover:bg-slate-700 rounded-lg px-3 py-2 transition-colors"
                    >
                      <div className="text-sm font-medium text-slate-200">{eventItem.name}</div>
                      <div className="text-xs text-slate-500">{eventItem.status} - {eventItem.format}</div>
                    </button>
                  ))
                )}
              </div>
            </aside>
          </div>
        )}

        {activeTab !== 'inscricao' && activeTab !== 'desempenho' && loading && (
          <div className="text-center py-16">
            <div className="inline-block w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full animate-spin mb-3" />
            <p className="text-slate-400">Carregando chaveamento...</p>
          </div>
        )}

        {activeTab !== 'inscricao' && activeTab !== 'desempenho' && error && !loading && (
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

        {!loading && !error && bracket && activeTab === 'grupos' && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-slate-200">Fase de Grupos</h2>
              <button type="button" onClick={loadBracket} className="text-xs text-slate-400 hover:text-white flex items-center gap-1.5 transition-colors">
                Atualizar
                {lastUpdated && <span className="text-slate-600">{lastUpdated.toLocaleTimeString('pt-BR')}</span>}
              </button>
            </div>
            <GroupStandings groups={bracket.groups} apiUrl={API_URL} onRefresh={loadBracket} />
          </div>
        )}

        {!loading && !error && bracket && activeTab === 'bracket' && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-slate-200">Chave Eliminatoria</h2>
              <button type="button" onClick={loadBracket} className="text-xs text-slate-400 hover:text-white transition-colors">Atualizar</button>
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

        {activeTab === 'desempenho' && (
          <div className="bg-slate-900 border border-slate-700/60 rounded-xl p-5">
            <div className="flex flex-col sm:flex-row gap-3 sm:items-end mb-5">
              <div className="flex-1">
                <label className={label}>ID do atleta</label>
                <input className={input} value={registeredPlayerId} onChange={(event) => setRegisteredPlayerId(event.target.value)} placeholder="Cole o ID do atleta ou cadastre-se primeiro" />
              </div>
              <button
                type="button"
                onClick={() => loadPerformance(registeredPlayerId)}
                className="bg-slate-700 hover:bg-slate-600 text-white font-semibold rounded-lg px-4 py-2 text-sm"
              >
                Ver desempenho
              </button>
            </div>

            {!performance ? (
              <p className="text-slate-500 text-sm">Depois do cadastro, o desempenho do atleta aparece aqui automaticamente.</p>
            ) : (
              <div className="space-y-5">
                <div>
                  <h2 className="text-xl font-bold text-white">{performance.player.fullName}</h2>
                  <p className="text-sm text-slate-500">Resumo competitivo do atleta</p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    ['Partidas', performance.summary.completed],
                    ['Vitorias', performance.summary.wins],
                    ['Derrotas', performance.summary.losses],
                    ['Aproveitamento', `${performance.summary.winRate}%`],
                    ['Sets', `${performance.summary.setsFor}/${performance.summary.setsAgainst}`],
                    ['Games', `${performance.summary.gamesFor}/${performance.summary.gamesAgainst}`],
                    ['Duplas', performance.summary.teams],
                    ['Pontos', performance.summary.rankingPoints],
                  ].map(([title, value]) => (
                    <div key={title} className="bg-slate-800 rounded-lg p-3">
                      <div className="text-xs text-slate-500">{title}</div>
                      <div className="text-lg font-bold text-slate-100">{value}</div>
                    </div>
                  ))}
                </div>

                <div>
                  <h3 className="font-semibold text-slate-200 mb-2">Duplas e modalidades</h3>
                  <div className="space-y-2">
                    {performance.teams.map((team: any) => (
                      <div key={team.id} className="bg-slate-800 rounded-lg px-3 py-2 text-sm text-slate-300">
                        {team.eventName} - Parceiro: {team.partner ?? 'A definir'}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
