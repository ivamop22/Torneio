'use client';
import { FormEvent, useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';

type EventItem  = { id: string; tournamentId: string; name: string; gender: string; format: string; category?: string | null; status: string };
type Tournament = { id: string; name: string; slug: string };

type MatchItem = {
  id: string;
  roundName: string;
  matchNumber: number;
  status: string;
  team1Id: string | null;
  team2Id: string | null;
};

type TeamItem = {
  id: string;
  seed?: number | null;
  player1?: { fullName: string } | null;
  player2?: { fullName: string } | null;
};

type BracketGroup = {
  id: string;
  name: string;
  standings: Array<{ teamId: string; rankPosition: number | null; played: number; wins: number; losses: number; points: number; team: { id: string; label: string } | null }>;
  matches: Array<{ id: string; matchNumber: number; status: string; team1: { label: string } | null; team2: { label: string } | null }>;
};

type BracketData = {
  event: { id: string; name: string; status: string };
  groups: BracketGroup[];
  knockout: Record<string, any[]>;
  knockoutRoundOrder: string[];
  isGroupPhase: boolean;
  isKnockoutPhase: boolean;
  champion: any | null;
};

type Mode = 'auto' | 'manual';

type Props = {
  events: EventItem[];
  tournaments: Tournament[];
  apiRequest: (url: string, method: string, body?: any) => Promise<any>;
  onRefresh: () => void;
  showMsg: (msg: string, type?: 'ok' | 'err') => void;
};

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

function teamLabel(t: TeamItem) {
  const p1 = t.player1?.fullName ?? '?';
  const p2 = t.player2?.fullName;
  const label = p2 ? `${p1} / ${p2}` : p1;
  return t.seed ? `#${t.seed} ${label}` : label;
}

export function DrawTab({ events, tournaments, apiRequest, onRefresh, showMsg }: Props) {
  const { authFetch } = useAuth();
  const [eventId, setEventId]       = useState(events[0]?.id ?? '');
  const [groupCount, setGroupCount] = useState('2');
  const [generating, setGenerating] = useState(false);
  const [deleting, setDeleting]     = useState(false);
  const [mode, setMode]             = useState<Mode>('auto');

  const [bracketData, setBracketData]     = useState<BracketData | null>(null);
  const [loadingBracket, setLoadingBracket] = useState(false);

  const [scheduledMatches, setScheduledMatches] = useState<MatchItem[]>([]);
  const [eventTeams, setEventTeams]             = useState<TeamItem[]>([]);
  const [assignments, setAssignments]           = useState<Record<string, { team1Id: string; team2Id: string }>>({});
  const [loadingManual, setLoadingManual]       = useState(false);
  const [savingManual, setSavingManual]         = useState(false);

  const selectedEvent      = events.find(ev => ev.id === eventId);
  const selectedTournament = tournaments.find(t => t.id === selectedEvent?.tournamentId);
  const hasBracket         = !!(bracketData && bracketData.groups.length > 0);

  async function loadBracket(evId: string) {
    if (!evId) return;
    setLoadingBracket(true);
    try {
      const res = await fetch(`${API_URL}/events/${evId}/bracket`);
      if (!res.ok) { setBracketData(null); return; }
      const data: BracketData = await res.json();
      setBracketData(data.groups.length > 0 || data.isKnockoutPhase ? data : null);
    } catch {
      setBracketData(null);
    } finally {
      setLoadingBracket(false);
    }
  }

  async function loadManualData(evId: string) {
    if (!evId) return;
    setLoadingManual(true);
    try {
      const [matchesRes, teamsRes] = await Promise.all([
        fetch(`${API_URL}/matches?eventId=${evId}&status=scheduled`),
        fetch(`${API_URL}/teams?eventId=${evId}`),
      ]);
      const matchesData = matchesRes.ok ? await matchesRes.json() : [];
      const teamsData   = teamsRes.ok  ? await teamsRes.json()   : [];
      const matches: MatchItem[] = Array.isArray(matchesData) ? matchesData : [];
      const teams: TeamItem[]    = Array.isArray(teamsData)   ? teamsData   : [];
      setScheduledMatches(matches);
      setEventTeams(teams);
      const init: Record<string, { team1Id: string; team2Id: string }> = {};
      for (const m of matches) {
        init[m.id] = { team1Id: m.team1Id ?? '', team2Id: m.team2Id ?? '' };
      }
      setAssignments(init);
    } catch {
      // ignore
    } finally {
      setLoadingManual(false);
    }
  }

  useEffect(() => {
    setBracketData(null);
    setScheduledMatches([]);
    setEventTeams([]);
    setAssignments({});
    if (eventId) loadBracket(eventId);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventId]);

  // When switching to manual mode and bracket exists, auto-load match data
  useEffect(() => {
    if (mode === 'manual' && hasBracket && scheduledMatches.length === 0 && !loadingManual) {
      loadManualData(eventId);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, hasBracket]);

  async function handleGenerate(e: FormEvent) {
    e.preventDefault();
    if (!eventId) { showMsg('Selecione um evento', 'err'); return; }
    setGenerating(true);
    try {
      await apiRequest('/draws/generate-group-knockout', 'POST', { eventId, groupCount: Number(groupCount) });
      showMsg('Chaveamento gerado com sucesso!');
      onRefresh();
      await loadBracket(eventId);
    } catch (err: any) {
      showMsg(err.message, 'err');
    } finally {
      setGenerating(false);
    }
  }

  async function handleCreateStructure(e: FormEvent) {
    e.preventDefault();
    if (!eventId) { showMsg('Selecione um evento', 'err'); return; }
    setGenerating(true);
    try {
      await apiRequest('/draws/generate-group-knockout', 'POST', { eventId, groupCount: Number(groupCount) });
      showMsg('Estrutura criada! Agora atribua as duplas às partidas.');
      onRefresh();
      await loadBracket(eventId);
      await loadManualData(eventId);
    } catch (err: any) {
      showMsg(err.message, 'err');
    } finally {
      setGenerating(false);
    }
  }

  async function handleSaveManual() {
    if (!eventId) return;
    setSavingManual(true);
    try {
      const payload = scheduledMatches.map(m => ({
        matchId: m.id,
        team1Id: assignments[m.id]?.team1Id || null,
        team2Id: assignments[m.id]?.team2Id || null,
      }));
      await apiRequest(`/events/${eventId}/bracket/manual`, 'PUT', { assignments: payload });
      showMsg('Atribuição salva com sucesso!');
      onRefresh();
    } catch (err: any) {
      showMsg(err.message, 'err');
    } finally {
      setSavingManual(false);
    }
  }

  async function handleDeleteBracket() {
    if (!eventId) return;
    if (!window.confirm('Tem certeza que deseja excluir o chaveamento? Todas as partidas e placares serão apagados.')) return;
    setDeleting(true);
    try {
      const res = await authFetch(`/events/${eventId}/bracket`, { method: 'DELETE' });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message ?? `Erro ${res.status}`);
      }
      showMsg('Chaveamento excluído. Você pode gerar um novo.');
      setBracketData(null);
      setScheduledMatches([]);
      setEventTeams([]);
      setAssignments({});
      onRefresh();
    } catch (err: any) {
      showMsg(err.message ?? 'Erro ao excluir chaveamento', 'err');
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto flex flex-col gap-6">

      {/* Event + Mode selector */}
      <div className="card p-6">
        <div className="flex flex-col gap-4">
          <div>
            <label className="label">Evento *</label>
            <select
              className="input"
              value={eventId}
              onChange={e => { setEventId(e.target.value); setMode('auto'); }}
            >
              {events.length === 0 && <option value="">Nenhum evento disponível</option>}
              {events.map(ev => (
                <option key={ev.id} value={ev.id}>
                  {ev.name}{ev.status === 'live' ? ' ✓ chaveado' : ''}
                </option>
              ))}
            </select>
          </div>

          {events.length > 0 && (
            <div>
              <label className="label">Tipo de chaveamento</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setMode('auto')}
                  className="py-4 rounded-xl text-sm font-bold border-2 transition-all flex flex-col items-center gap-1.5"
                  style={{
                    background: mode === 'auto' ? 'rgba(180,255,61,0.12)' : 'var(--bg-surface)',
                    borderColor: mode === 'auto' ? 'var(--accent-lime)' : 'var(--border)',
                    color: mode === 'auto' ? 'var(--accent-lime)' : 'var(--text-muted)',
                  }}
                >
                  <span style={{ fontSize: '1.5rem' }}>⚡</span>
                  <span>Automático</span>
                  <span style={{ fontSize: '0.7rem', fontWeight: 400, color: 'var(--text-faint)', lineHeight: 1.3, textAlign: 'center' }}>
                    Sistema distribui as duplas automaticamente
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setMode('manual')}
                  className="py-4 rounded-xl text-sm font-bold border-2 transition-all flex flex-col items-center gap-1.5"
                  style={{
                    background: mode === 'manual' ? 'rgba(180,255,61,0.12)' : 'var(--bg-surface)',
                    borderColor: mode === 'manual' ? 'var(--accent-lime)' : 'var(--border)',
                    color: mode === 'manual' ? 'var(--accent-lime)' : 'var(--text-muted)',
                  }}
                >
                  <span style={{ fontSize: '1.5rem' }}>✋</span>
                  <span>Manual</span>
                  <span style={{ fontSize: '0.7rem', fontWeight: 400, color: 'var(--text-faint)', lineHeight: 1.3, textAlign: 'center' }}>
                    Você define quem joga em cada partida
                  </span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── AUTOMÁTICO MODE ── */}
      {mode === 'auto' && (
        <>
          <div className="card p-6">
            <div className="flex items-center gap-3 mb-5">
              <span style={{ fontSize: '1.6rem' }}>⚡</span>
              <div>
                <h2 className="font-display text-xl font-bold">Chaveamento Automático</h2>
                <p className="text-sm text-[var(--text-muted)]">O sistema distribui as duplas em grupos igualmente</p>
              </div>
            </div>

            <form onSubmit={handleGenerate} className="flex flex-col gap-5">
              <div>
                <label className="label">Número de grupos</label>
                <div className="flex gap-3">
                  {['2', '3', '4', '6', '8'].map(n => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setGroupCount(n)}
                      className="flex-1 py-2.5 rounded-md text-sm font-bold border transition-all"
                      style={{
                        background: groupCount === n ? 'var(--accent-lime)' : 'var(--bg-surface)',
                        color: groupCount === n ? '#050810' : 'var(--text-muted)',
                        borderColor: groupCount === n ? 'var(--accent-lime)' : 'var(--border)',
                      }}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>

              {selectedEvent && (
                <div className="card-elevated p-4 rounded-lg text-sm">
                  <div className="text-xs text-[var(--text-muted)] uppercase tracking-widest mb-2 font-semibold">Resumo</div>
                  <div className="space-y-1">
                    <div className="flex justify-between">
                      <span className="text-[var(--text-muted)]">Evento</span>
                      <span className="font-medium">{selectedEvent.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[var(--text-muted)]">Formato</span>
                      <span className="font-medium">{selectedEvent.format}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[var(--text-muted)]">Grupos</span>
                      <span className="font-medium">{groupCount}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[var(--text-muted)]">Mín. duplas necessárias</span>
                      <span className="font-medium">{Number(groupCount) * 2} duplas</span>
                    </div>
                  </div>
                </div>
              )}

              <button
                type="submit"
                className="btn btn-primary btn-lg"
                disabled={generating || events.length === 0}
              >
                {generating ? (
                  <><span className="spinner" /> Gerando chaveamento...</>
                ) : hasBracket ? (
                  'Regenerar Chaveamento'
                ) : (
                  'Gerar Chaveamento'
                )}
              </button>
            </form>
          </div>

          {/* Bracket display */}
          {loadingBracket ? (
            <div className="card p-6 flex items-center gap-3 text-[var(--text-muted)] text-sm">
              <span className="spinner" /> Verificando chaveamento existente...
            </div>
          ) : hasBracket ? (
            <div className="card p-6">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h3 className="font-display text-xl font-bold">Chaveamento Gerado</h3>
                  <p className="text-sm text-[var(--text-muted)] mt-0.5">{bracketData!.groups.length} grupo(s) • {bracketData!.event.name}</p>
                </div>
                <div className="flex gap-2 shrink-0">
                  {selectedTournament?.slug && (
                    <a
                      href={`/torneios/${selectedTournament.slug}`}
                      target="_blank"
                      className="btn btn-secondary btn-sm"
                    >
                      Ver ao vivo ↗
                    </a>
                  )}
                  <button
                    type="button"
                    onClick={handleDeleteBracket}
                    disabled={deleting}
                    className="btn btn-sm"
                    style={{ background: 'rgba(255,64,96,0.12)', color: '#FF6080', border: '1px solid rgba(255,64,96,0.3)' }}
                  >
                    {deleting ? <><span className="spinner" style={{ width: '0.75rem', height: '0.75rem', borderWidth: '2px' }} /> Excluindo...</> : '🗑 Excluir'}
                  </button>
                </div>
              </div>

              <div className="flex flex-col gap-4">
                {bracketData!.groups.map((group) => (
                  <div key={group.id} className="card-elevated rounded-lg overflow-hidden">
                    <div className="px-4 py-2 text-xs font-bold uppercase tracking-widest text-[var(--text-muted)] border-b border-[var(--border)]">
                      {group.name}
                    </div>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid var(--border)' }}>
                          <th style={{ padding: '0.5rem 1rem', textAlign: 'left', color: 'var(--text-muted)', fontWeight: 600 }}>#</th>
                          <th style={{ padding: '0.5rem 1rem', textAlign: 'left', color: 'var(--text-muted)', fontWeight: 600 }}>Dupla</th>
                          <th style={{ padding: '0.5rem 1rem', textAlign: 'center', color: 'var(--text-muted)', fontWeight: 600 }}>J</th>
                          <th style={{ padding: '0.5rem 1rem', textAlign: 'center', color: 'var(--text-muted)', fontWeight: 600 }}>V</th>
                          <th style={{ padding: '0.5rem 1rem', textAlign: 'center', color: 'var(--text-muted)', fontWeight: 600 }}>D</th>
                          <th style={{ padding: '0.5rem 1rem', textAlign: 'center', color: 'var(--text-muted)', fontWeight: 600 }}>Pts</th>
                        </tr>
                      </thead>
                      <tbody>
                        {group.standings.map((s, i) => (
                          <tr key={s.teamId} style={{ borderBottom: '1px solid var(--border)', background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.02)' }}>
                            <td style={{ padding: '0.5rem 1rem', color: 'var(--text-muted)' }}>{i + 1}</td>
                            <td style={{ padding: '0.5rem 1rem', fontWeight: 500, color: 'var(--text-primary)' }}>
                              {s.team?.label ?? '—'}
                            </td>
                            <td style={{ padding: '0.5rem 1rem', textAlign: 'center', color: 'var(--text-muted)' }}>{s.played}</td>
                            <td style={{ padding: '0.5rem 1rem', textAlign: 'center', color: 'var(--accent-lime)' }}>{s.wins}</td>
                            <td style={{ padding: '0.5rem 1rem', textAlign: 'center', color: 'var(--text-muted)' }}>{s.losses}</td>
                            <td style={{ padding: '0.5rem 1rem', textAlign: 'center', fontWeight: 700, color: 'var(--text-primary)' }}>{s.points}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <div className="px-4 py-3 flex flex-col gap-2">
                      {group.matches.map(m => (
                        <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem' }}>
                          <span style={{ color: 'var(--text-muted)', minWidth: '2rem' }}>#{m.matchNumber}</span>
                          <span style={{ flex: 1, color: 'var(--text-primary)' }}>{m.team1?.label ?? 'A definir'}</span>
                          <span style={{ color: 'var(--text-muted)', fontWeight: 700, fontSize: '0.7rem', padding: '0.1rem 0.4rem', background: 'var(--bg-elevated)', borderRadius: '4px' }}>VS</span>
                          <span style={{ flex: 1, textAlign: 'right', color: 'var(--text-primary)' }}>{m.team2?.label ?? 'A definir'}</span>
                          <span style={{
                            fontSize: '0.65rem', fontWeight: 600, padding: '0.1rem 0.4rem', borderRadius: '4px',
                            background: m.status === 'completed' ? 'rgba(180,255,61,0.15)' : 'rgba(255,255,255,0.05)',
                            color: m.status === 'completed' ? 'var(--accent-lime)' : 'var(--text-muted)',
                          }}>
                            {m.status === 'completed' ? 'Concluída' : 'Agendada'}
                          </span>
                          {m.status !== 'completed' && (
                            <a
                              href={`/matches/${m.id}/score`}
                              style={{
                                fontSize: '0.65rem', fontWeight: 700, padding: '0.2rem 0.5rem', borderRadius: '4px',
                                background: 'rgba(180,255,61,0.12)', color: 'var(--accent-lime)',
                                border: '1px solid rgba(180,255,61,0.3)', textDecoration: 'none', whiteSpace: 'nowrap',
                              }}
                            >
                              Lançar Placar →
                            </a>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </>
      )}

      {/* ── MANUAL MODE ── */}
      {mode === 'manual' && (
        <>
          {!hasBracket ? (
            /* No bracket yet — need to create structure first */
            <div className="card p-6">
              <div className="flex items-center gap-3 mb-5">
                <span style={{ fontSize: '1.6rem' }}>✋</span>
                <div>
                  <h2 className="font-display text-xl font-bold">Chaveamento Manual</h2>
                  <p className="text-sm text-[var(--text-muted)]">Defina você mesmo quem joga em cada partida</p>
                </div>
              </div>

              <div
                className="rounded-xl p-4 mb-5 text-sm"
                style={{ background: 'rgba(255, 193, 7, 0.08)', border: '1px solid rgba(255, 193, 7, 0.25)', color: 'var(--text-muted)' }}
              >
                <div className="font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>⚠️ Primeiro passo: criar a estrutura</div>
                Para atribuição manual, o sistema precisa criar os grupos e as partidas primeiro.
                Escolha o número de grupos e clique em "Criar Estrutura" — depois você atribui as duplas manualmente.
              </div>

              <form onSubmit={handleCreateStructure} className="flex flex-col gap-5">
                <div>
                  <label className="label">Número de grupos</label>
                  <div className="flex gap-3">
                    {['2', '3', '4', '6', '8'].map(n => (
                      <button
                        key={n}
                        type="button"
                        onClick={() => setGroupCount(n)}
                        className="flex-1 py-2.5 rounded-md text-sm font-bold border transition-all"
                        style={{
                          background: groupCount === n ? 'var(--accent-lime)' : 'var(--bg-surface)',
                          color: groupCount === n ? '#050810' : 'var(--text-muted)',
                          borderColor: groupCount === n ? 'var(--accent-lime)' : 'var(--border)',
                        }}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                </div>

                {selectedEvent && (
                  <div className="card-elevated p-4 rounded-lg text-sm">
                    <div className="text-xs text-[var(--text-muted)] uppercase tracking-widest mb-2 font-semibold">Resumo</div>
                    <div className="space-y-1">
                      <div className="flex justify-between">
                        <span className="text-[var(--text-muted)]">Evento</span>
                        <span className="font-medium">{selectedEvent.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[var(--text-muted)]">Grupos a criar</span>
                        <span className="font-medium">{groupCount}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[var(--text-muted)]">Mín. duplas necessárias</span>
                        <span className="font-medium">{Number(groupCount) * 2} duplas</span>
                      </div>
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  className="btn btn-primary btn-lg"
                  disabled={generating || events.length === 0}
                >
                  {generating ? (
                    <><span className="spinner" /> Criando estrutura...</>
                  ) : (
                    'Criar Estrutura e Atribuir Manualmente'
                  )}
                </button>
              </form>
            </div>
          ) : (
            /* Bracket exists — show manual assignment */
            <div className="card p-6">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-3">
                  <span style={{ fontSize: '1.6rem' }}>✋</span>
                  <div>
                    <h2 className="font-display text-xl font-bold">Atribuição Manual de Duplas</h2>
                    <p className="text-sm text-[var(--text-muted)]">Defina quais duplas jogam em cada partida</p>
                  </div>
                </div>
                {selectedTournament?.slug && (
                  <a
                    href={`/torneios/${selectedTournament.slug}`}
                    target="_blank"
                    className="btn btn-secondary btn-sm shrink-0"
                  >
                    Ver ao vivo ↗
                  </a>
                )}
              </div>

              <div
                className="rounded-xl p-3 my-4 text-xs"
                style={{ background: 'rgba(180,255,61,0.06)', border: '1px solid rgba(180,255,61,0.2)', color: 'var(--text-muted)' }}
              >
                Estrutura: <strong style={{ color: 'var(--text-primary)' }}>{bracketData!.groups.length} grupo(s)</strong> • {bracketData!.event.name}
                &nbsp;·&nbsp;
                <button
                  type="button"
                  onClick={() => loadManualData(eventId)}
                  style={{ color: 'var(--accent-lime)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.75rem', padding: 0 }}
                >
                  ↺ Recarregar partidas
                </button>
              </div>

              {loadingManual ? (
                <div className="flex items-center gap-2 text-[var(--text-muted)] text-sm py-6">
                  <span className="spinner" /> Carregando partidas...
                </div>
              ) : scheduledMatches.length === 0 ? (
                <div className="py-6 text-center text-[var(--text-muted)] text-sm">
                  <p className="mb-3">Nenhuma partida agendada encontrada.</p>
                  <button
                    type="button"
                    onClick={() => loadManualData(eventId)}
                    className="btn btn-secondary btn-sm"
                  >
                    Carregar partidas
                  </button>
                </div>
              ) : (
                <>
                  {/* Group partidas by roundName */}
                  {(() => {
                    const byRound: Record<string, MatchItem[]> = {};
                    for (const m of scheduledMatches) {
                      if (!byRound[m.roundName]) byRound[m.roundName] = [];
                      byRound[m.roundName].push(m);
                    }
                    return Object.entries(byRound).map(([round, matches]) => (
                      <div key={round} className="mb-5">
                        <div className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-widest mb-3 px-1">
                          {round}
                        </div>
                        <div className="flex flex-col gap-3">
                          {matches.map(m => (
                            <div key={m.id} className="card-elevated p-4 rounded-lg">
                              <div className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-widest mb-3">
                                Partida #{m.matchNumber}
                              </div>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                  <label className="label">Dupla 1</label>
                                  <select
                                    className="input"
                                    value={assignments[m.id]?.team1Id ?? ''}
                                    onChange={e => setAssignments(prev => ({
                                      ...prev,
                                      [m.id]: { ...prev[m.id], team1Id: e.target.value },
                                    }))}
                                  >
                                    <option value="">— A definir —</option>
                                    {eventTeams.map(t => (
                                      <option key={t.id} value={t.id} disabled={assignments[m.id]?.team2Id === t.id}>
                                        {teamLabel(t)}
                                      </option>
                                    ))}
                                  </select>
                                </div>
                                <div>
                                  <label className="label">Dupla 2</label>
                                  <select
                                    className="input"
                                    value={assignments[m.id]?.team2Id ?? ''}
                                    onChange={e => setAssignments(prev => ({
                                      ...prev,
                                      [m.id]: { ...prev[m.id], team2Id: e.target.value },
                                    }))}
                                  >
                                    <option value="">— A definir —</option>
                                    {eventTeams.map(t => (
                                      <option key={t.id} value={t.id} disabled={assignments[m.id]?.team1Id === t.id}>
                                        {teamLabel(t)}
                                      </option>
                                    ))}
                                  </select>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ));
                  })()}

                  <button
                    type="button"
                    onClick={handleSaveManual}
                    className="btn btn-primary btn-lg w-full mt-2"
                    disabled={savingManual}
                  >
                    {savingManual ? <><span className="spinner" /> Salvando...</> : 'Salvar Atribuição Manual'}
                  </button>
                </>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
