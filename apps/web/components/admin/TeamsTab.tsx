'use client';
import { FormEvent, useEffect, useState } from 'react';
import { ConfirmDialog } from '../ui/ConfirmDialog';

type Tournament = { id: string; name: string };
type EventItem  = { id: string; tournamentId: string; name: string; gender: string; format: string; category?: string | null; status: string };
type Player     = { id: string; fullName: string; gender?: string | null };
type Team       = { id: string; eventId?: string; seed?: number | null; status: string; player1?: { id: string; fullName: string } | null; player2?: { id: string; fullName: string } | null };

type Props = {
  tournaments?: Tournament[];
  events: EventItem[];
  players: Player[];
  teams: Team[];
  apiRequest: (url: string, method: string, body?: any) => Promise<any>;
  onRefresh: () => void;
  showMsg: (msg: string, type?: 'ok' | 'err') => void;
};

export function TeamsTab({ tournaments = [], events, players, teams, apiRequest, onRefresh, showMsg }: Props) {
  const [selectedTournamentId, setSelectedTournamentId] = useState(tournaments[0]?.id ?? '');
  const [eventId, setEventId] = useState('');
  const [p1Id, setP1Id]       = useState('');
  const [p2Id, setP2Id]       = useState('');
  const [seed, setSeed]       = useState('');
  const [saving, setSaving]   = useState(false);

  const [editId, setEditId]         = useState<string | null>(null);
  const [editSeed, setEditSeed]     = useState('');
  const [editP1Id, setEditP1Id]     = useState('');
  const [editP2Id, setEditP2Id]     = useState('');
  const [editSaving, setEditSaving] = useState(false);

  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const filteredEvents = selectedTournamentId
    ? events.filter(e => e.tournamentId === selectedTournamentId)
    : events;

  const filteredEventIds = new Set(filteredEvents.map(e => e.id));
  const filteredTeams = teams.filter(t => t.eventId && filteredEventIds.has(t.eventId));

  const eventMap = Object.fromEntries(events.map(e => [e.id, e]));

  // Reset eventId when tournament or events change
  useEffect(() => {
    const first = filteredEvents[0]?.id ?? '';
    setEventId(first);
  }, [selectedTournamentId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Initialize eventId on first load
  useEffect(() => {
    if (!eventId && filteredEvents.length > 0) {
      setEventId(filteredEvents[0].id);
    }
  }, [filteredEvents, eventId]);

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

  function startEdit(t: Team) {
    setEditId(t.id);
    setEditSeed(t.seed != null ? String(t.seed) : '');
    setEditP1Id(t.player1?.id ?? '');
    setEditP2Id(t.player2?.id ?? '');
  }

  function cancelEdit() {
    setEditId(null);
    setEditSeed('');
    setEditP1Id('');
    setEditP2Id('');
  }

  async function handleEditSave(e: FormEvent) {
    e.preventDefault();
    if (!editId) return;
    if (editP1Id && editP2Id && editP1Id === editP2Id) {
      showMsg('Os dois jogadores devem ser diferentes', 'err');
      return;
    }
    setEditSaving(true);
    try {
      await apiRequest(`/teams/${editId}`, 'PATCH', {
        seed: editSeed ? Number(editSeed) : null,
        player1Id: editP1Id || undefined,
        player2Id: editP2Id || undefined,
      });
      showMsg('Dupla atualizada!');
      cancelEdit();
      onRefresh();
    } catch (err: any) {
      showMsg(err.message, 'err');
    } finally {
      setEditSaving(false);
    }
  }

  async function handleDelete(id: string) {
    try {
      await apiRequest(`/teams/${id}`, 'DELETE');
      showMsg('Dupla removida');
      onRefresh();
      if (editId === id) cancelEdit();
    } catch (err: any) {
      showMsg(err.message, 'err');
    } finally {
      setConfirmDeleteId(null);
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-6 items-start">
      {/* Create Form */}
      <div className="card p-6">
        <h2 className="font-display text-xl font-bold mb-5">Nova Dupla</h2>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {tournaments.length > 0 && (
            <div>
              <label className="label">Torneio *</label>
              <select className="input" value={selectedTournamentId} onChange={e => setSelectedTournamentId(e.target.value)} required>
                {tournaments.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>
          )}
          <div>
            <label className="label">Evento *</label>
            <select className="input" value={eventId} onChange={e => setEventId(e.target.value)} required>
              {filteredEvents.length === 0 && <option value="">Nenhum evento neste torneio</option>}
              {filteredEvents.map(ev => <option key={ev.id} value={ev.id}>{ev.name}</option>)}
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
          <button type="submit" className="btn btn-primary btn-lg mt-1" disabled={saving || filteredEvents.length === 0 || players.length < 2}>
            {saving ? <><span className="spinner" /> Salvando...</> : '+ Criar Dupla'}
          </button>
        </form>
      </div>

      {/* List */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <h2 className="font-display text-xl font-bold">
            Duplas <span className="text-[var(--text-muted)] font-normal text-base">({filteredTeams.length})</span>
          </h2>
          {tournaments.length > 1 && (
            <select
              className="input"
              style={{ width: 'auto', minWidth: '200px' }}
              value={selectedTournamentId}
              onChange={e => setSelectedTournamentId(e.target.value)}
            >
              {tournaments.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          )}
        </div>

        {filteredTeams.length === 0 ? (
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
                  <th>Evento</th>
                  <th>Status</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredTeams.map(t => (
                  <>
                    <tr key={t.id} className={editId === t.id ? 'bg-[var(--bg-elevated)]' : ''}>
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
                        <span className="text-sm text-[var(--text-muted)]">
                          {t.eventId ? (eventMap[t.eventId]?.name ?? '—') : '—'}
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${t.status === 'accepted' ? 'badge-done' : 'badge-draft'}`}>{t.status}</span>
                      </td>
                      <td>
                        <div className="flex gap-2">
                          <button
                            onClick={() => editId === t.id ? cancelEdit() : startEdit(t)}
                            className="btn btn-secondary btn-sm"
                            title="Editar dupla"
                          >
                            {editId === t.id ? '✕' : '✏️'}
                          </button>
                          <button
                            onClick={() => setConfirmDeleteId(t.id)}
                            className="btn btn-danger btn-sm"
                            title="Excluir dupla"
                          >
                            🗑
                          </button>
                        </div>
                      </td>
                    </tr>
                    {editId === t.id && (
                      <tr key={`edit-${t.id}`}>
                        <td colSpan={5} style={{ padding: '0.75rem 1rem', background: 'var(--bg-elevated)' }}>
                          <form onSubmit={handleEditSave} className="flex flex-wrap gap-3 items-end">
                            <div>
                              <label className="label">Seed</label>
                              <input
                                className="input"
                                style={{ width: '80px' }}
                                type="number"
                                min="1"
                                placeholder="—"
                                value={editSeed}
                                onChange={e => setEditSeed(e.target.value)}
                              />
                            </div>
                            <div>
                              <label className="label">Jogador 1</label>
                              <select className="input" value={editP1Id} onChange={e => setEditP1Id(e.target.value)}>
                                <option value="">—</option>
                                {players.map(p => (
                                  <option key={p.id} value={p.id} disabled={p.id === editP2Id}>{p.fullName}</option>
                                ))}
                              </select>
                            </div>
                            <div>
                              <label className="label">Jogador 2</label>
                              <select className="input" value={editP2Id} onChange={e => setEditP2Id(e.target.value)}>
                                <option value="">—</option>
                                {players.map(p => (
                                  <option key={p.id} value={p.id} disabled={p.id === editP1Id}>{p.fullName}</option>
                                ))}
                              </select>
                            </div>
                            <div className="flex gap-2">
                              <button type="submit" className="btn btn-primary btn-sm" disabled={editSaving}>
                                {editSaving ? <><span className="spinner" /> Salvando...</> : 'Salvar'}
                              </button>
                              <button type="button" className="btn btn-secondary btn-sm" onClick={cancelEdit}>
                                Cancelar
                              </button>
                            </div>
                          </form>
                        </td>
                      </tr>
                    )}
                  </>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {confirmDeleteId && (
        <ConfirmDialog
          title="Excluir dupla?"
          description="A dupla será removida permanentemente. Esta ação não pode ser desfeita."
          confirmLabel="Excluir"
          onConfirm={() => handleDelete(confirmDeleteId)}
          onCancel={() => setConfirmDeleteId(null)}
        />
      )}
    </div>
  );
}
