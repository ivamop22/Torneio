'use client';
import { FormEvent, useState } from 'react';

type EventItem  = { id: string; tournamentId: string; name: string; gender: string; format: string; category?: string | null; status: string };
type Tournament = { id: string; name: string; slug: string };

type Props = {
  events: EventItem[];
  tournaments: Tournament[];
  apiRequest: (url: string, method: string, body?: any) => Promise<any>;
  onRefresh: () => void;
  showMsg: (msg: string, type?: 'ok' | 'err') => void;
};

export function DrawTab({ events, tournaments, apiRequest, onRefresh, showMsg }: Props) {
  const [eventId, setEventId]     = useState(events[0]?.id ?? '');
  const [groupCount, setGroupCount] = useState('2');
  const [generating, setGenerating] = useState(false);
  const [generated, setGenerated]   = useState<string | null>(null);

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
    } catch (err: any) {
      showMsg(err.message, 'err');
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div className="max-w-lg mx-auto">
      <div className="card p-8">
        <div className="text-center mb-7">
          <div className="text-5xl mb-3">🎯</div>
          <h2 className="font-display text-2xl font-bold">Gerar Chaveamento</h2>
          <p className="text-sm text-[var(--text-muted)] mt-1">Configura grupos e mata-mata automaticamente</p>
        </div>

        <form onSubmit={handleGenerate} className="flex flex-col gap-5">
          <div>
            <label className="label">Evento *</label>
            <select className="input" value={eventId} onChange={e => { setEventId(e.target.value); setGenerated(null); }} required>
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
              '⚡ Gerar Chaveamento'
            )}
          </button>
        </form>

        {generated && (
          <div className="mt-5 p-4 rounded-lg bg-[rgba(180,255,61,0.08)] border border-[rgba(180,255,61,0.2)] text-center">
            <div className="text-[var(--accent-lime)] font-semibold mb-2">✓ Chaveamento gerado!</div>
            <a
              href={`/torneios/${generated}`}
              target="_blank"
              className="btn btn-secondary btn-sm inline-flex"
            >
              Ver chaveamento ao vivo ↗
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
