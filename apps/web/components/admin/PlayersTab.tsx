'use client';
import { FormEvent, useState } from 'react';
import { ConfirmDialog } from '../ui/ConfirmDialog';

const ESTADOS_BR = [
  { uf: 'AC', nome: 'Acre' }, { uf: 'AL', nome: 'Alagoas' }, { uf: 'AP', nome: 'Amapá' },
  { uf: 'AM', nome: 'Amazonas' }, { uf: 'BA', nome: 'Bahia' }, { uf: 'CE', nome: 'Ceará' },
  { uf: 'DF', nome: 'Distrito Federal' }, { uf: 'ES', nome: 'Espírito Santo' }, { uf: 'GO', nome: 'Goiás' },
  { uf: 'MA', nome: 'Maranhão' }, { uf: 'MT', nome: 'Mato Grosso' }, { uf: 'MS', nome: 'Mato Grosso do Sul' },
  { uf: 'MG', nome: 'Minas Gerais' }, { uf: 'PA', nome: 'Pará' }, { uf: 'PB', nome: 'Paraíba' },
  { uf: 'PR', nome: 'Paraná' }, { uf: 'PE', nome: 'Pernambuco' }, { uf: 'PI', nome: 'Piauí' },
  { uf: 'RJ', nome: 'Rio de Janeiro' }, { uf: 'RN', nome: 'Rio Grande do Norte' },
  { uf: 'RS', nome: 'Rio Grande do Sul' }, { uf: 'RO', nome: 'Rondônia' }, { uf: 'RR', nome: 'Roraima' },
  { uf: 'SC', nome: 'Santa Catarina' }, { uf: 'SP', nome: 'São Paulo' },
  { uf: 'SE', nome: 'Sergipe' }, { uf: 'TO', nome: 'Tocantins' },
];

type Player = { id: string; fullName: string; gender?: string | null; email?: string | null; rankingPoints: number };

type Props = {
  players: Player[];
  apiRequest: (url: string, method: string, body?: any) => Promise<any>;
  onRefresh: () => void;
  showMsg: (msg: string, type?: 'ok' | 'err') => void;
};

function initials(name: string) {
  return name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase();
}

export function PlayersTab({ players, apiRequest, onRefresh, showMsg }: Props) {
  const [editId, setEditId] = useState<string | null>(null);
  const [name, setName]     = useState('');
  const [gender, setGender] = useState('');
  const [email, setEmail]   = useState('');
  const [saving, setSaving] = useState(false);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  // Bulk selection state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [confirmBulkDelete, setConfirmBulkDelete] = useState(false);

  function startEdit(p: Player) {
    setEditId(p.id);
    setName(p.fullName);
    setGender(p.gender ?? '');
    setEmail(p.email ?? '');
  }
  function cancelEdit() {
    setEditId(null); setName(''); setGender(''); setEmail('');
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!name.trim()) { showMsg('Informe o nome do jogador', 'err'); return; }
    setSaving(true);
    try {
      const payload = { fullName: name.trim(), gender: gender || undefined, email: email || undefined, nationality: 'BR' };
      if (editId) {
        await apiRequest(`/players/${editId}`, 'PUT', payload);
        showMsg('Jogador atualizado!');
      } else {
        await apiRequest('/players', 'POST', payload);
        showMsg('Jogador cadastrado!');
      }
      cancelEdit();
      onRefresh();
    } catch (err: any) {
      showMsg(err.message, 'err');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    try {
      await apiRequest(`/players/${id}`, 'DELETE');
      showMsg('Jogador removido');
      onRefresh();
      if (editId === id) cancelEdit();
    } catch (err: any) {
      showMsg(err.message, 'err');
    } finally {
      setConfirmId(null);
    }
  }

  async function handleBulkDelete() {
    const ids = Array.from(selectedIds);
    try {
      const result = await apiRequest('/players/bulk', 'DELETE', { ids });
      const msg = result.skipped > 0
        ? `${result.deleted} jogador(es) removido(s). ${result.skipped} ignorado(s) por ter partidas ativas.`
        : `${result.deleted} jogador(es) removido(s).`;
      showMsg(msg, result.deleted > 0 ? 'ok' : 'err');
      setSelectedIds(new Set());
      onRefresh();
    } catch (err: any) {
      showMsg(err.message, 'err');
    } finally {
      setConfirmBulkDelete(false);
    }
  }

  function toggleSelect(id: string) {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const filtered = players.filter(p => !search || p.fullName.toLowerCase().includes(search.toLowerCase()));
  const allFilteredSelected = filtered.length > 0 && filtered.every(p => selectedIds.has(p.id));

  function toggleSelectAll() {
    if (allFilteredSelected) {
      setSelectedIds(prev => {
        const next = new Set(prev);
        filtered.forEach(p => next.delete(p.id));
        return next;
      });
    } else {
      setSelectedIds(prev => {
        const next = new Set(prev);
        filtered.forEach(p => next.add(p.id));
        return next;
      });
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-6 items-start">
      {/* Form */}
      <div className="card p-6">
        <h2 className="font-display text-xl font-bold mb-5">
          {editId ? 'Editar Jogador' : 'Novo Jogador'}
        </h2>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="label">Nome completo *</label>
            <input className="input" placeholder="Nome do atleta" value={name} onChange={e => setName(e.target.value)} required />
          </div>
          <div className="form-row form-row-2">
            <div>
              <label className="label">Sexo</label>
              <select className="input" value={gender} onChange={e => setGender(e.target.value)}>
                <option value="">Não informado</option>
                <option value="male">Masculino</option>
                <option value="female">Feminino</option>
              </select>
            </div>
            <div>
              <label className="label">E-mail</label>
              <input className="input" type="email" placeholder="email@exemplo.com" value={email} onChange={e => setEmail(e.target.value)} />
            </div>
          </div>
          <div className="flex gap-3 mt-1">
            {editId && (
              <button type="button" onClick={cancelEdit} className="btn btn-secondary flex-1">
                Cancelar
              </button>
            )}
            <button type="submit" className={`btn btn-primary btn-lg ${editId ? 'flex-1' : 'w-full'}`} disabled={saving}>
              {saving ? <><span className="spinner" /> Salvando...</> : editId ? 'Salvar alterações' : '+ Cadastrar'}
            </button>
          </div>
        </form>
      </div>

      {/* List */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-3 flex-wrap">
          <h2 className="font-display text-xl font-bold">Jogadores <span className="text-[var(--text-muted)] font-normal text-base">({players.length})</span></h2>
          <div className="ml-auto flex items-center gap-3">
            {selectedIds.size > 0 && (
              <button
                onClick={() => setConfirmBulkDelete(true)}
                className="btn btn-danger btn-sm"
              >
                Excluir selecionados ({selectedIds.size})
              </button>
            )}
            <input
              className="input"
              style={{ width: '200px' }}
              placeholder="Buscar jogador..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="card">
            <div className="empty-state">
              <span className="empty-state-icon">👤</span>
              <p className="font-semibold">{search ? 'Nenhum resultado' : 'Nenhum jogador cadastrado'}</p>
            </div>
          </div>
        ) : (
          <>
            {/* Select All */}
            <div className="flex items-center gap-2 px-1">
              <input
                type="checkbox"
                id="select-all-players"
                checked={allFilteredSelected}
                onChange={toggleSelectAll}
                style={{ width: '16px', height: '16px', cursor: 'pointer', accentColor: 'var(--accent-lime)' }}
              />
              <label htmlFor="select-all-players" className="text-sm text-[var(--text-muted)] cursor-pointer select-none">
                Selecionar todos ({filtered.length})
              </label>
            </div>

            <div className="flex flex-col gap-2">
              {filtered.map(p => (
                <div key={p.id} className={`card p-3 flex items-center gap-3 ${editId === p.id ? 'border-[var(--accent-lime)]' : ''} ${selectedIds.has(p.id) ? 'border-[var(--accent-lime)]/50 bg-[var(--accent-lime)]/5' : ''}`}>
                  {/* Checkbox */}
                  <input
                    type="checkbox"
                    checked={selectedIds.has(p.id)}
                    onChange={() => toggleSelect(p.id)}
                    style={{ width: '16px', height: '16px', cursor: 'pointer', accentColor: 'var(--accent-lime)', flexShrink: 0 }}
                  />
                  {/* Avatar */}
                  <div className="w-9 h-9 rounded-full bg-[var(--bg-elevated)] border border-[var(--border-glow)] flex items-center justify-center text-xs font-bold text-[var(--accent-lime)] shrink-0">
                    {initials(p.fullName)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate">{p.fullName}</div>
                    <div className="text-xs text-[var(--text-muted)]">
                      {p.gender === 'male' ? 'Masculino' : p.gender === 'female' ? 'Feminino' : '—'}
                      {p.email && ` · ${p.email}`}
                      {p.rankingPoints > 0 && <span className="ml-1 text-[var(--accent-gold)]">★ {p.rankingPoints} pts</span>}
                    </div>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button onClick={() => startEdit(p)} className="btn btn-secondary btn-sm">✏️</button>
                    <button onClick={() => setConfirmId(p.id)} className="btn btn-danger btn-sm">🗑</button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {confirmId && (
        <ConfirmDialog
          title="Remover jogador?"
          description="O jogador será removido do sistema. Duplas associadas podem ser afetadas."
          confirmLabel="Remover"
          onConfirm={() => handleDelete(confirmId)}
          onCancel={() => setConfirmId(null)}
        />
      )}

      {confirmBulkDelete && (
        <ConfirmDialog
          title={`Excluir ${selectedIds.size} jogador(es)?`}
          description="Os jogadores selecionados serão removidos. Jogadores com partidas ativas serão ignorados automaticamente."
          confirmLabel="Excluir selecionados"
          onConfirm={handleBulkDelete}
          onCancel={() => setConfirmBulkDelete(false)}
        />
      )}
    </div>
  );
}
