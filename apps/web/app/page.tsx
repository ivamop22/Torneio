'use client';

import { FormEvent, useCallback, useEffect, useState } from 'react';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

type Tournament = { id: string; name: string; slug: string; status: string; city?: string | null; startDate: string; endDate: string };
type EventItem = { id: string; tournamentId: string; name: string; gender: string; format: string; category?: string | null; status: string };
type Player = { id: string; fullName: string; gender?: string | null; email?: string | null; rankingPoints: number };
type Team = { id: string; seed?: number | null; status: string; player1?: { id: string; fullName: string } | null; player2?: { id: string; fullName: string } | null };

export default function AdminPage() {
  const [tab, setTab] = useState<'torneios' | 'eventos' | 'jogadores' | 'duplas' | 'chaveamento'>('torneios');
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  // Form states
  const [tName, setTName] = useState(''); const [tCity, setTCity] = useState(''); const [tState, setTState] = useState('');
  const [tStart, setTStart] = useState(''); const [tEnd, setTEnd] = useState('');

  const [evTournamentId, setEvTournamentId] = useState(''); const [evName, setEvName] = useState('');
  const [evGender, setEvGender] = useState('mixed'); const [evFormat, setEvFormat] = useState('group_knockout');
  const [evCategory, setEvCategory] = useState(''); const [evMaxPairs, setEvMaxPairs] = useState('');

  const [pName, setPName] = useState(''); const [pGender, setPGender] = useState('');
  const [pEmail, setPEmail] = useState(''); const [pNat, setPNat] = useState('');

  const [teamEventId, setTeamEventId] = useState('');
  const [p1Id, setP1Id] = useState(''); const [p2Id, setP2Id] = useState(''); const [tSeed, setTSeed] = useState('');

  const [drawEventId, setDrawEventId] = useState(''); const [groupCount, setGroupCount] = useState('2');

  const showMsg = (msg: string) => { setMessage(msg); setTimeout(() => setMessage(''), 3000); };

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [ts, es, ps, tms] = await Promise.all([
        fetch(`${API_URL}/tournaments`).then((r) => r.json()),
        fetch(`${API_URL}/events`).then((r) => r.json()),
        fetch(`${API_URL}/players`).then((r) => r.json()),
        fetch(`${API_URL}/teams`).then((r) => r.json()),
      ]);
      setTournaments(ts); setEvents(es); setPlayers(ps); setTeams(tms);
      if (ts.length && !evTournamentId) setEvTournamentId(ts[0].id);
      if (es.length && !teamEventId) setTeamEventId(es[0].id);
      if (es.length && !drawEventId) setDrawEventId(es[0].id);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  async function post(url: string, body: any) {
    const r = await fetch(`${API_URL}${url}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    return r.json();
  }

  async function handleTournament(e: FormEvent) {
    e.preventDefault();
    const slug = tName.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-') + '-' + Date.now();
    await post('/tournaments', { name: tName, slug, city: tCity, state: tState, startDate: tStart, endDate: tEnd });
    setTName(''); setTCity(''); setTState(''); setTStart(''); setTEnd('');
    showMsg('✅ Torneio criado!'); loadAll();
  }

  async function handleEvent(e: FormEvent) {
    e.preventDefault();
    await post('/events', { tournamentId: evTournamentId, name: evName, gender: evGender, format: evFormat, category: evCategory || undefined, maxPairs: evMaxPairs ? Number(evMaxPairs) : undefined });
    setEvName(''); setEvCategory(''); setEvMaxPairs('');
    showMsg('✅ Evento criado!'); loadAll();
  }

  async function handlePlayer(e: FormEvent) {
    e.preventDefault();
    await post('/players', { fullName: pName, gender: pGender || undefined, email: pEmail || undefined, nationality: pNat || undefined });
    setPName(''); setPGender(''); setPEmail(''); setPNat('');
    showMsg('✅ Jogador criado!'); loadAll();
  }

  async function handleTeam(e: FormEvent) {
    e.preventDefault();
    await post('/teams', { eventId: teamEventId, player1Id: p1Id, player2Id: p2Id, seed: tSeed ? Number(tSeed) : undefined });
    setP1Id(''); setP2Id(''); setTSeed('');
    showMsg('✅ Dupla criada!'); loadAll();
  }

  async function handleDraw(e: FormEvent) {
    e.preventDefault();
    await post('/draws/generate-group-knockout', { eventId: drawEventId, groupCount: Number(groupCount) });
    showMsg('🎯 Chaveamento gerado! Verificando em /torneios...');
    loadAll();
    // Navegar para o torneio
    const ev = events.find((ev) => ev.id === drawEventId);
    const t = tournaments.find((t) => t.id === ev?.tournamentId);
    if (t) window.open(`/torneios/${t.slug}`, '_blank');
  }

  const input = 'w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-green-500 transition-colors';
  const select = `${input}`;
  const btn = 'w-full bg-green-600 hover:bg-green-500 text-white font-semibold py-2.5 px-4 rounded-lg transition-colors text-sm';

  const TABS = [
    { key: 'torneios', label: '🏆 Torneios' },
    { key: 'eventos', label: '📋 Eventos' },
    { key: 'jogadores', label: '👤 Jogadores' },
    { key: 'duplas', label: '👥 Duplas' },
    { key: 'chaveamento', label: '🎯 Chaveamento' },
  ] as const;

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Top bar */}
      <nav className="bg-slate-900 border-b border-slate-800 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🎾</span>
            <div>
              <div className="text-white font-bold text-sm">Beach Tennis Platform</div>
              <div className="text-slate-500 text-xs">Painel do Organizador</div>
            </div>
          </div>
          <div className="ml-auto flex items-center gap-3">
            <a href="/torneios" target="_blank" className="text-sm text-green-400 hover:text-green-300 transition-colors">
              Ver Torneios Públicos ↗
            </a>
          </div>
        </div>
      </nav>

      {/* Toast */}
      {message && (
        <div className="fixed top-16 right-4 z-50 bg-green-800 text-green-100 border border-green-600 px-4 py-3 rounded-xl shadow-xl text-sm font-medium transition-all">
          {message}
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {/* Stats row */}
        {!loading && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            {[
              { label: 'Torneios', value: tournaments.length, icon: '🏆', color: 'text-yellow-400' },
              { label: 'Eventos', value: events.length, icon: '📋', color: 'text-blue-400' },
              { label: 'Jogadores', value: players.length, icon: '👤', color: 'text-purple-400' },
              { label: 'Duplas', value: teams.length, icon: '👥', color: 'text-green-400' },
            ].map((s) => (
              <div key={s.label} className="bg-slate-900 border border-slate-700/60 rounded-xl p-4 flex items-center gap-3">
                <span className="text-2xl">{s.icon}</span>
                <div>
                  <div className={`text-xl font-bold ${s.color}`}>{s.value}</div>
                  <div className="text-xs text-slate-500">{s.label}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Sidebar tabs */}
          <div className="lg:col-span-1">
            <div className="bg-slate-900 border border-slate-700/60 rounded-xl p-2 space-y-1">
              {TABS.map((t) => (
                <button
                  key={t.key}
                  onClick={() => setTab(t.key)}
                  className={`w-full text-left px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                    tab === t.key ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Main content */}
          <div className="lg:col-span-2">
            {/* TORNEIOS */}
            {tab === 'torneios' && (
              <div className="space-y-4">
                <div className="bg-slate-900 border border-slate-700/60 rounded-xl p-5">
                  <h2 className="font-bold text-slate-200 mb-4">Criar Torneio</h2>
                  <form onSubmit={handleTournament} className="space-y-3">
                    <input className={input} placeholder="Nome do torneio *" value={tName} onChange={(e) => setTName(e.target.value)} required />
                    <div className="grid grid-cols-2 gap-3">
                      <input className={input} placeholder="Cidade" value={tCity} onChange={(e) => setTCity(e.target.value)} />
                      <input className={input} placeholder="Estado" value={tState} onChange={(e) => setTState(e.target.value)} />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div><label className="text-xs text-slate-500 mb-1 block">Início *</label><input type="date" className={input} value={tStart} onChange={(e) => setTStart(e.target.value)} required /></div>
                      <div><label className="text-xs text-slate-500 mb-1 block">Fim *</label><input type="date" className={input} value={tEnd} onChange={(e) => setTEnd(e.target.value)} required /></div>
                    </div>
                    <button className={btn} type="submit">Criar Torneio</button>
                  </form>
                </div>

                <div className="bg-slate-900 border border-slate-700/60 rounded-xl overflow-hidden">
                  <div className="px-5 py-3 border-b border-slate-800">
                    <h3 className="font-semibold text-slate-300">Torneios cadastrados ({tournaments.length})</h3>
                  </div>
                  {loading ? <div className="p-8 text-center text-slate-500">Carregando...</div> : (
                    <div className="divide-y divide-slate-800">
                      {tournaments.map((t) => (
                        <div key={t.id} className="px-5 py-3 flex items-center justify-between gap-3">
                          <div>
                            <div className="font-medium text-slate-200">{t.name}</div>
                            <div className="text-xs text-slate-500">{t.city} • {t.startDate?.slice(0, 10)}</div>
                          </div>
                          <a href={`/torneios/${t.slug}`} target="_blank" className="text-xs text-green-400 hover:text-green-300 shrink-0">
                            Ver →
                          </a>
                        </div>
                      ))}
                      {tournaments.length === 0 && <div className="p-8 text-center text-slate-500">Nenhum torneio ainda.</div>}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* EVENTOS */}
            {tab === 'eventos' && (
              <div className="space-y-4">
                <div className="bg-slate-900 border border-slate-700/60 rounded-xl p-5">
                  <h2 className="font-bold text-slate-200 mb-4">Criar Evento / Categoria</h2>
                  <form onSubmit={handleEvent} className="space-y-3">
                    <select className={select} value={evTournamentId} onChange={(e) => setEvTournamentId(e.target.value)} required>
                      <option value="">Selecione um torneio *</option>
                      {tournaments.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                    </select>
                    <input className={input} placeholder="Nome do evento (ex: Masculino A) *" value={evName} onChange={(e) => setEvName(e.target.value)} required />
                    <div className="grid grid-cols-2 gap-3">
                      <select className={select} value={evGender} onChange={(e) => setEvGender(e.target.value)}>
                        <option value="male">Masculino</option>
                        <option value="female">Feminino</option>
                        <option value="mixed">Misto</option>
                        <option value="open">Open</option>
                      </select>
                      <select className={select} value={evFormat} onChange={(e) => setEvFormat(e.target.value)}>
                        <option value="group_knockout">Grupos + Mata-mata</option>
                        <option value="knockout">Mata-mata</option>
                        <option value="round_robin">Round Robin</option>
                      </select>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <input className={input} placeholder="Categoria (ex: C)" value={evCategory} onChange={(e) => setEvCategory(e.target.value)} />
                      <input className={input} placeholder="Máx. duplas" type="number" value={evMaxPairs} onChange={(e) => setEvMaxPairs(e.target.value)} />
                    </div>
                    <button className={btn} type="submit">Criar Evento</button>
                  </form>
                </div>

                <div className="bg-slate-900 border border-slate-700/60 rounded-xl overflow-hidden">
                  <div className="px-5 py-3 border-b border-slate-800"><h3 className="font-semibold text-slate-300">Eventos ({events.length})</h3></div>
                  <div className="divide-y divide-slate-800">
                    {events.map((ev) => (
                      <div key={ev.id} className="px-5 py-3">
                        <div className="font-medium text-slate-200">{ev.name}</div>
                        <div className="text-xs text-slate-500">{ev.gender} • {ev.format} • {ev.status}</div>
                      </div>
                    ))}
                    {events.length === 0 && <div className="p-8 text-center text-slate-500">Nenhum evento ainda.</div>}
                  </div>
                </div>
              </div>
            )}

            {/* JOGADORES */}
            {tab === 'jogadores' && (
              <div className="space-y-4">
                <div className="bg-slate-900 border border-slate-700/60 rounded-xl p-5">
                  <h2 className="font-bold text-slate-200 mb-4">Cadastrar Jogador</h2>
                  <form onSubmit={handlePlayer} className="space-y-3">
                    <input className={input} placeholder="Nome completo *" value={pName} onChange={(e) => setPName(e.target.value)} required />
                    <div className="grid grid-cols-2 gap-3">
                      <select className={select} value={pGender} onChange={(e) => setPGender(e.target.value)}>
                        <option value="">Gênero</option>
                        <option value="male">Masculino</option>
                        <option value="female">Feminino</option>
                        <option value="other">Outro</option>
                      </select>
                      <input className={input} placeholder="Nacionalidade" value={pNat} onChange={(e) => setPNat(e.target.value)} />
                    </div>
                    <input className={input} type="email" placeholder="E-mail" value={pEmail} onChange={(e) => setPEmail(e.target.value)} />
                    <button className={btn} type="submit">Cadastrar Jogador</button>
                  </form>
                </div>

                <div className="bg-slate-900 border border-slate-700/60 rounded-xl overflow-hidden">
                  <div className="px-5 py-3 border-b border-slate-800"><h3 className="font-semibold text-slate-300">Jogadores ({players.length})</h3></div>
                  <div className="divide-y divide-slate-800 max-h-80 overflow-y-auto">
                    {players.map((p) => (
                      <div key={p.id} className="px-5 py-2.5 flex items-center justify-between">
                        <div>
                          <div className="font-medium text-slate-200 text-sm">{p.fullName}</div>
                          <div className="text-xs text-slate-500">{p.gender ?? '—'} • {p.email ?? '—'}</div>
                        </div>
                        <div className="text-xs text-yellow-400 font-bold">{p.rankingPoints} pts</div>
                      </div>
                    ))}
                    {players.length === 0 && <div className="p-8 text-center text-slate-500">Nenhum jogador ainda.</div>}
                  </div>
                </div>
              </div>
            )}

            {/* DUPLAS */}
            {tab === 'duplas' && (
              <div className="space-y-4">
                <div className="bg-slate-900 border border-slate-700/60 rounded-xl p-5">
                  <h2 className="font-bold text-slate-200 mb-4">Criar Dupla</h2>
                  <form onSubmit={handleTeam} className="space-y-3">
                    <select className={select} value={teamEventId} onChange={(e) => setTeamEventId(e.target.value)} required>
                      <option value="">Selecione evento *</option>
                      {events.map((ev) => <option key={ev.id} value={ev.id}>{ev.name}</option>)}
                    </select>
                    <select className={select} value={p1Id} onChange={(e) => setP1Id(e.target.value)} required>
                      <option value="">Jogador 1 *</option>
                      {players.map((p) => <option key={p.id} value={p.id}>{p.fullName}</option>)}
                    </select>
                    <select className={select} value={p2Id} onChange={(e) => setP2Id(e.target.value)} required>
                      <option value="">Jogador 2 *</option>
                      {players.map((p) => <option key={p.id} value={p.id}>{p.fullName}</option>)}
                    </select>
                    <input className={input} placeholder="Seed (opcional)" type="number" value={tSeed} onChange={(e) => setTSeed(e.target.value)} />
                    <button className={btn} type="submit">Criar Dupla</button>
                  </form>
                </div>

                <div className="bg-slate-900 border border-slate-700/60 rounded-xl overflow-hidden">
                  <div className="px-5 py-3 border-b border-slate-800"><h3 className="font-semibold text-slate-300">Duplas ({teams.length})</h3></div>
                  <div className="divide-y divide-slate-800 max-h-80 overflow-y-auto">
                    {teams.map((t) => (
                      <div key={t.id} className="px-5 py-2.5">
                        <div className="font-medium text-slate-200 text-sm">
                          {t.player1?.fullName ?? '?'} / {t.player2?.fullName ?? '?'}
                        </div>
                        <div className="text-xs text-slate-500">Seed: {t.seed ?? '—'}</div>
                      </div>
                    ))}
                    {teams.length === 0 && <div className="p-8 text-center text-slate-500">Nenhuma dupla ainda.</div>}
                  </div>
                </div>
              </div>
            )}

            {/* CHAVEAMENTO */}
            {tab === 'chaveamento' && (
              <div className="space-y-4">
                <div className="bg-slate-900 border border-slate-700/60 rounded-xl p-5">
                  <h2 className="font-bold text-slate-200 mb-1">🤖 Motor de Chaveamento Automático</h2>
                  <p className="text-slate-500 text-sm mb-5">
                    Gera grupos, distribuição serpentina, round-robin, mata-mata automático e detecta o campeão.
                  </p>
                  <form onSubmit={handleDraw} className="space-y-3">
                    <select className={select} value={drawEventId} onChange={(e) => setDrawEventId(e.target.value)} required>
                      <option value="">Selecione evento *</option>
                      {events.map((ev) => <option key={ev.id} value={ev.id}>{ev.name}</option>)}
                    </select>
                    <div>
                      <label className="text-xs text-slate-500 mb-1 block">Número de grupos</label>
                      <select className={select} value={groupCount} onChange={(e) => setGroupCount(e.target.value)}>
                        {[2, 3, 4].map((n) => <option key={n} value={n}>{n} grupos</option>)}
                      </select>
                    </div>
                    <button className={btn} type="submit">🎯 Gerar Chaveamento</button>
                  </form>
                </div>

                <div className="bg-slate-800/50 border border-slate-700/40 rounded-xl p-5">
                  <h3 className="font-semibold text-slate-300 mb-3">Como funciona o motor</h3>
                  <div className="space-y-3 text-sm">
                    {[
                      { step: '1', title: 'Distribuição Serpentina', desc: 'Times distribuídos nos grupos por seed (S1→G1, S2→G2, S3→G2, S4→G1...)' },
                      { step: '2', title: 'Round-Robin por Grupo', desc: 'Todas as duplas se enfrentam dentro do grupo. Resultado é lançado na página pública.' },
                      { step: '3', title: 'Classificação Automática', desc: 'Pts → Saldo Sets → Saldo Games. Top 2 de cada grupo avançam.' },
                      { step: '4', title: 'Mata-Mata Gerado', desc: 'Quando todos os grupos terminam, o bracket é criado automaticamente (crossover G1#1 vs G2#2).' },
                      { step: '5', title: 'Avanço Automático', desc: 'Ao registrar um resultado, o vencedor avança para a próxima partida automaticamente.' },
                      { step: '6', title: 'Campeão + Ranking', desc: 'Vencedor da Final é o Campeão. Pontos de ranking são creditados automaticamente.' },
                    ].map((s) => (
                      <div key={s.step} className="flex gap-3">
                        <div className="w-6 h-6 rounded-full bg-green-700 text-white text-xs flex items-center justify-center shrink-0 mt-0.5 font-bold">{s.step}</div>
                        <div>
                          <div className="font-medium text-slate-200">{s.title}</div>
                          <div className="text-slate-500 text-xs mt-0.5">{s.desc}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
