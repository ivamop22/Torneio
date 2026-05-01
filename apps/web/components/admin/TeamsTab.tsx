'use client';
import { FormEvent, useState } from 'react';

type EventItem = { id: string; tournamentId: string; name: string; gender: string; format: string; category?: string | null; status: string };
type Player    = { id: string; fullName: string; gender?: string | null };
type Team      = { id: string; seed?: number | null; status: string; player1?: { id: string; fullName: string } | null; player2?: { id: string; fullName: string } | null };

type Props = {
  events: EventItem[];
  players: Player[];
  teams: Team[];
  apiRequest: (url: string, method: string, body?: any) => Promise<any>;
  onRefresh: () => void;
  showMsg: (msg: string, type?: 'ok' | 'err') => void;
};

export function TeamsTab({ events, players, teams, apiRequest, onRefresh, showMsg }: Props) {
  const [eventId, setEventId] = useState(events[0]?.id ?? '');
  const [p1Id, setP1Id]       = useState('');
  const [p2Id, setP2Id]       = useState('');
  const [seed, setSeed]       = useState('');
  const [saving, setSaving]   = useState(false);

  const eventTeams = teams.filter(t => {
    // filter by event if we have the data, otherwise show all
    return true;
  });

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!eventId || !p1Id || !p2Id) { showMsg('Selecione o evento e os dois jogadores', 'err'); return; }
    if (p1Id === p2Id) { showMsg('Os dois jogadores devem ser diferentes', 'err'); return; }
    setSaving(true);
    try {
      await apiRequest('/teams', 'POST', { eventId, player1Id: p1Id, player2Id: p2Id, seed: seed ? Number(seed) : undefined });
      setP1Id(''); setP2Id(''); setSeed('');
      showMsg('Dupla criada!');
      onRefresh();
    } catch (err: any) {
      showMsg(err.message, 'err');
    } finally {
      setSaving(false);
    }
  }

  const selectedEvent = events.find(ev => ev.id === eventId);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-6 items-start">
      {/* Form */}
      <div className="card p-6">
        <h2 className="font-display text-xl font-bold mb-5">Nova Dupla</h2>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="label">Evento *</label>
            <select className="input" value={eventId} onChange={e => setEventId(e.target.value)} required>
              {events.length === 0 && <option value="">Nenhum evento</option>}
              {events.map(ev => <option key={ev.id} value={ev.id}>{ev.name}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Jogador 1 *</label>
            <select className="input" value={p1Id} onChange={e => setP1Id(e.target.value)} required>
              <option value="">Selecionar jogador</option>
              {players.map(p => (
                <option key={p.id} value={p.id} disabled={p.id === p2Id}>{p.fullName}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Jogador 2 *</label>
            <select className="input" value={p2Id} onChange={e => setP2Id(e.target.value)} required>
              <option value="">Selecionar jogador</option>
              {players.map(p => (
                <option key={p.id} value={p.id} disabled={p.id === p1Id}>{p.fullName}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Seed (opcional)</label>
            <input className="input" type="number" min="1" placeholder="Ex: 1 = cabeça de chave" value={seed} onChange={e => setSeed(e.target.value)} />
          </div>
          <button type="submit" className="btn btn-primary btn-lg mt-1" disabled={saving || events.length === 0 || players.length < 2}>
            {saving ? <><span className="spinner" /> Salvando...</> : '+ Criar Dupla'}
          </button>
        </form>
      </div>

      {/* List */}
      <div className="flex flex-col gap-4">
        <h2 className="font-display text-xl font-bold">Duplas Cadastradas <span className="text-[var(--text-muted)] font-normal text-base">({teams.length})</span></h2>
        {teams.length === 0 ? (
          <div className="card">
            <div className="empty-state">
              <span className="empty-state-icon">👥</span>
              <p className="font-semibold">Nenhuma dupla cadastrada</p>
              <p className="text-sm text-[var(--text-faint)]">Cadastre os jogadores primeiro e depois forme as duplas</p>
            </div>
          </div>
        ) : (
          <div className="card overflow-hidden">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Seed</th>
                  <th>Dupla</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {teams.map(t => (
                  <tr key={t.id}>
                    <td>
                      {t.seed
                        ? <span className="font-display text-lg text-[var(--accent-gold)]">#{t.seed}</span>
                        : <span className="text-[var(--text-faint)]">—</span>
                      }
                    </td>
                    <td>
                      <div className="font-medium text-sm">
                        {t.player1?.fullName ?? '?'} <span className="text-[var(--text-faint)]">/</span> {t.player2?.fullName ?? '?'}
                      </div>
                    </td>
                    <td>
                      <span className={`badge ${t.status === 'accepted' ? 'badge-done' : 'badge-draft'}`}>{t.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
