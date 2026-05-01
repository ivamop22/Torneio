'use client';
import { FormEvent, useState } from 'react';
import { ConfirmDialog } from '../ui/ConfirmDialog';

type Tournament = { id: string; name: string };
type EventItem  = { id: string; tournamentId: string; name: string; gender: string; format: string; category?: string | null; status: string };

const GENDER_OPTIONS = [
  { value: 'male',   label: 'Masculino' },
  { value: 'female', label: 'Feminino' },
  { value: 'mixed',  label: 'Misto' },
  { value: 'open',   label: 'Aberto' },
];
const FORMAT_OPTIONS = [
  { value: 'group_knockout', label: 'Grupos + Mata-mata' },
  { value: 'knockout',       label: 'Mata-mata' },
  { value: 'round_robin',    label: 'Round Robin' },
  { value: 'group_stage',    label: 'Fase de Grupos' },
];
const STATUS_INFO: Record<string, string> = {
  draft: 'badge-draft', open: 'badge-open', closed: 'badge-draft',
  live: 'badge-live', finished: 'badge-done', cancelled: 'badge-cancelled',
};
const STATUS_LABEL: Record<string, string> = {
  draft: 'Rascunho', open: 'Aberto', closed: 'Fechado',
  live: 'Ao Vivo', finished: 'Finalizado', cancelled: 'Cancelado',
};

type Props = {
  events: EventItem[];
  tournaments: Tournament[];
  apiRequest: (url: string, method: string, body?: any) => Promise<any>;
  onRefresh: () => void;
  showMsg: (msg: string, type?: 'ok' | 'err') => void;
};

export function EventsTab({ events, tournaments, apiRequest, onRefresh, showMsg }: Props) {
  const [tournamentId, setTournamentId] = useState(tournaments[0]?.id ?? '');
  const [name, setName]       = useState('');
  const [gender, setGender]   = useState('mixed');
  const [format, setFormat]   = useState('group_knockout');
  const [category, setCategory] = useState('');
  const [maxPairs, setMaxPairs] = useState('');
  const [saving, setSaving]   = useState(false);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!tournamentId || !name.trim()) { showMsg('Selecione o torneio e informe o nome', 'err'); return; }
    setSaving(true);
    try {
      await apiRequest('/events', 'POST', {
        tournamentId,
        name: name.trim(),
        gender,
        format,
        category: category || undefined,
        maxPairs: maxPairs ? Number(maxPairs) : undefined,
      });
      setName(''); setCategory(''); setMaxPairs('');
      showMsg('Evento criado!');
      onRefresh();
    } catch (err: any) {
      showMsg(err.message, 'err');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    try {
      await apiRequest(`/events/${id}`, 'DELETE');
      showMsg('Evento excluído');
      onRefresh();
    } catch (err: any) {
      showMsg(err.message, 'err');
    } finally {
      setConfirmId(null);
    }
  }

  const grouped = tournaments.map(t => ({
    tournament: t,
    events: events.filter(ev => ev.tournamentId === t.id),
  })).filter(g => g.events.length > 0);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-6 items-start">
      {/* Form */}
      <div className="card p-6">
        <h2 className="font-display text-xl font-bold mb-5">Novo Evento</h2>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="label">Torneio *</label>
            <select className="input" value={tournamentId} onChange={e => setTournamentId(e.target.value)} required>
              {tournaments.length === 0 && <option value="">Nenhum torneio</option>}
              {tournaments.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Nome do evento *</label>
            <input className="input" placeholder="Ex: Masculino Adulto A" value={name} onChange={e => setName(e.target.value)} required />
          </div>
          <div className="form-row form-row-2">
            <div>
              <label className="label">Modalidade</label>
              <select className="input" value={gender} onChange={e => setGender(e.target.value)}>
                {GENDER_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Formato</label>
              <select className="input" value={format} onChange={e => setFormat(e.target.value)}>
                {FORMAT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
          </div>
          <div className="form-row form-row-2">
            <div>
              <label className="label">Categoria</label>
              <input className="input" placeholder="Ex: Adulto A" value={category} onChange={e => setCategory(e.target.value)} />
            </div>
            <div>
              <label className="label">Máx. duplas</label>
              <input className="input" type="number" min="2" placeholder="Ex: 16" value={maxPairs} onChange={e => setMaxPairs(e.target.value)} />
            </div>
          </div>
          <button type="submit" className="btn btn-primary btn-lg mt-1" disabled={saving || tournaments.length === 0}>
            {saving ? <><span className="spinner" /> Salvando...</> : '+ Criar Evento'}
          </button>
        </form>
      </div>

      {/* List */}
      <div className="flex flex-col gap-5">
        <h2 className="font-display text-xl font-bold">Eventos <span className="text-[var(--text-muted)] font-normal text-base">({events.length})</span></h2>
        {events.length === 0 ? (
          <div className="card">
            <div className="empty-state">
              <span className="empty-state-icon">📋</span>
              <p className="font-semibold">Nenhum evento cadastrado</p>
              <p className="text-sm text-[var(--text-faint)]">Use "⚡ Eventos" no torneio para gerar automaticamente</p>
            </div>
          </div>
        ) : (
          grouped.map(({ tournament, events: evs }) => (
            <div key={tournament.id}>
              <div className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-widest mb-2 px-1">{tournament.name}</div>
              <div className="flex flex-col gap-2">
                {evs.map(ev => (
                  <div key={ev.id} className="card p-3 flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-sm truncate">{ev.name}</span>
                        <span className={`badge ${STATUS_INFO[ev.status] ?? 'badge-draft'}`}>{STATUS_LABEL[ev.status] ?? ev.status}</span>
                      </div>
                      {ev.category && <span className="text-xs text-[var(--text-muted)]">{ev.category} • {ev.format}</span>}
                    </div>
                    <button onClick={() => setConfirmId(ev.id)} className="btn btn-danger btn-sm shrink-0">🗑</button>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      {confirmId && (
        <ConfirmDialog
          title="Excluir evento?"
          description="Todos os dados do evento (duplas, chaveamento, partidas) serão removidos."
          confirmLabel="Excluir"
          onConfirm={() => handleDelete(confirmId)}
          onCancel={() => setConfirmId(null)}
        />
      )}
    </div>
  );
}
