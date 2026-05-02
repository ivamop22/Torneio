'use client';
import { FormEvent, useEffect, useState } from 'react';

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

type Props = {
  events: EventItem[];
  tournaments: Tournament[];
  apiRequest: (url: string, method: string, body?: any) => Promise<any>;
  onRefresh: () => void;
  showMsg: (msg: string, type?: 'ok' | 'err') => void;
};

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

export function DrawTab({ events, tournaments, apiRequest, onRefresh, showMsg }: Props) {
  const [eventId, setEventId]     = useState(events[0]?.id ?? '');
  const [groupCount, setGroupCount] = useState('2');
  const [generating, setGenerating] = useState(false);
  const [generated, setGenerated]   = useState<string | null>(null);

  // Manual assignment state
  const [scheduledMatches, setScheduledMatches] = useState<MatchItem[]>([]);
  const [eventTeams, setEventTeams]             = useState<TeamItem[]>([]);
  const [assignments, setAssignments]           = useState<Record<string, { team1Id: string; team2Id: string }>>({});
  const [loadingManual, setLoadingManual]       = useState(false);
  const [savingManual, setSavingManual]         = useState(false);

  const selectedEvent    = events.find(ev => ev.id === eventId);
  const selectedTournament = tournaments.find(t => t.id === selectedEvent?.tournamentId);

  async function handleGenerate(e: FormEvent) {
    e.preventDefault();
    if (!eventId) { showMsg('Selecione um evento', 'err'); return; }
    setGenerating(true);
    setGenerated(null);
    try {
      await apiRequest('/draws/generate-group-knockout', 'POST', { eventId, groupCount: Number(groupCount) });
      showMsg('Chaveamento gerado com sucesso!');
      setGenerated(selectedTournament?.slug ?? null);
      onRefresh();
      await loadManualData(eventId);
    } catch (err: any) {
      showMsg(err.message, 'err');
    } finally {
      setGenerating(false);
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
      // Init assignments from existing data
      const init: Record<string, { team1Id: string; team2Id: string }> = {};
      for (const m of matches) {
        init[m.id] = { team1Id: m.team1Id ?? '', team2Id: m.team2Id ?? '' };
      }
      setAssignments(init);
    } catch {
      // silently ignore
    } finally {
      setLoadingManual(false);
    }
  }

  useEffect(() => {
    if (generated) {
      loadManualData(eventId);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [generated, eventId]);

  function teamLabel(t: TeamItem) {
    const p1 = t.player1?.fullName ?? '?';
    const p2 = t.player2?.fullName;
    const label = p2 ? `${p1} / ${p2}` : p1;
    return t.seed ? `#${t.seed} ${label}` : label;
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

  return (
    <div className="max-w-2xl mx-auto flex flex-col gap-6">
      <div className="card p-8">
        <div className="text-center mb-7">
          <div className="text-5xl mb-3">🎯</div>
          <h2 className="font-display text-2xl font-bold">Gerar Chaveamento</h2>
          <p className="text-sm text-[var(--text-muted)] mt-1">Configura grupos e mata-mata automaticamente</p>
        </div>

        <form onSubmit={handleGenerate} className="flex flex-col gap-5">
          <div>
            <label className="label">Evento *</label>
            <select className="input" value={eventId} onChange={e => { setEventId(e.target.value); setGenerated(null); setScheduledMatches([]); setEventTeams([]); }} required>
              {events.length === 0 && <option value="">Nenhum evento disponível</option>}
              {events.map(ev => <option key={ev.id} value={ev.id}>{ev.name}</option>)}
            </select>
          </div>

          <div>
            <label className="label">Número de grupos</label>
            <div className="flex gap-3">
              {['2', '3', '4', '6', '8'].map(n => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setGroupCount(n)}
                  className={`flex-1 py-2.5 rounded-md text-sm font-bold border transition-all ${
                    groupCount === n
                      ? 'bg-[var(--accent-lime)] text-[#050810] border-[var(--accent-lime)]'
                      : 'bg-[var(--bg-surface)] text-[var(--text-muted)] border-[var(--border)] hover:border-[var(--border-glow)]'
                  }`}
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
              </div>
            </div>
          )}

          <button type="submit" className="btn btn-primary btn-lg" disabled={generating || events.length === 0}>
            {generating ? (
              <><span className="spinner" /> Gerando chaveamento...</>
            ) : (
              'Gerar Chaveamento'
            )}
          </button>
        </form>

        {generated && (
          <div className="mt-5 p-4 rounded-lg bg-[rgba(180,255,61,0.08)] border border-[rgba(180,255,61,0.2)] text-center">
            <div className="text-[var(--accent-lime)] font-semibold mb-2">Chaveamento gerado!</div>
            <a
              href={`/torneios/${generated}`}
              target="_blank"
              className="btn btn-secondary btn-sm inline-flex"
            >
              Ver chaveamento ao vivo
            </a>
          </div>
        )}
      </div>

      {/* Manual assignment section — shown after bracket is generated */}
      {generated && (
        <div className="card p-6">
          <h3 className="font-display text-xl font-bold mb-1">Atribuição Manual de Duplas</h3>
          <p className="text-sm text-[var(--text-muted)] mb-5">
            Defina quais duplas jogam em cada partida programada.
          </p>

          {loadingManual ? (
            <div className="flex items-center gap-2 text-[var(--text-muted)] text-sm py-4">
              <span className="spinner" /> Carregando partidas...
            </div>
          ) : scheduledMatches.length === 0 ? (
            <p className="text-sm text-[var(--text-faint)] py-4">
              Nenhuma partida programada encontrada para este evento.
            </p>
          ) : (
            <>
              <div className="flex flex-col gap-4">
                {scheduledMatches.map(m => (
                  <div key={m.id} className="card-elevated p-4 rounded-lg">
                    <div className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-widest mb-3">
                      {m.roundName} — Partida #{m.matchNumber}
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
                            <option
                              key={t.id}
                              value={t.id}
                              disabled={assignments[m.id]?.team2Id === t.id}
                            >
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
                            <option
                              key={t.id}
                              value={t.id}
                              disabled={assignments[m.id]?.team1Id === t.id}
                            >
                              {teamLabel(t)}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={handleSaveManual}
                className="btn btn-primary btn-lg mt-5 w-full"
                disabled={savingManual}
              >
                {savingManual ? <><span className="spinner" /> Salvando...</> : 'Salvar Atribuição'}
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
