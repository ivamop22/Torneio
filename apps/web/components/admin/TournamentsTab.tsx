'use client';
import { FormEvent, useEffect, useState } from 'react';
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

type Tournament = { id: string; name: string; slug: string; status: string; city?: string | null; state?: string | null; startDate: string; endDate: string };

const STATUS_INFO: Record<string, { label: string; cls: string }> = {
  live:      { label: 'Ao Vivo',    cls: 'badge-live' },
  finished:  { label: 'Finalizado', cls: 'badge-done' },
  open:      { label: 'Aberto',     cls: 'badge-open' },
  ongoing:   { label: 'Em Andamento', cls: 'badge-ongoing' },
  draft:     { label: 'Rascunho',   cls: 'badge-draft' },
  published: { label: 'Publicado',  cls: 'badge-published' },
  cancelled: { label: 'Cancelado',  cls: 'badge-cancelled' },
};

type Props = {
  tournaments: Tournament[];
  apiRequest: (url: string, method: string, body?: any) => Promise<any>;
  onRefresh: () => void;
  showMsg: (msg: string, type?: 'ok' | 'err') => void;
};

export function TournamentsTab({ tournaments, apiRequest, onRefresh, showMsg }: Props) {
  const [name, setName]     = useState('');
  const [state, setState]   = useState('');
  const [city, setCity]     = useState('');
  const [start, setStart]   = useState('');
  const [end, setEnd]       = useState('');
  const [cidades, setCidades] = useState<string[]>([]);
  const [loadingCities, setLoadingCities] = useState(false);
  const [saving, setSaving] = useState(false);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  useEffect(() => {
    if (!state) { setCidades([]); setCity(''); return; }
    setLoadingCities(true);
    setCity('');
    fetch(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${state}/municipios?orderBy=nome`)
      .then(r => r.json())
      .then((data: { nome: string }[]) => setCidades(data.map(c => c.nome)))
      .catch(() => setCidades([]))
      .finally(() => setLoadingCities(false));
  }, [state]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!name.trim() || !start || !end) { showMsg('Preencha nome, data de início e fim', 'err'); return; }
    setSaving(true);
    try {
      await apiRequest('/tournaments', 'POST', { name: name.trim(), city: city || undefined, state: state || undefined, startDate: start, endDate: end });
      setName(''); setCity(''); setState(''); setStart(''); setEnd('');
      showMsg('Torneio criado com sucesso!');
      onRefresh();
    } catch (err: any) {
      showMsg(err.message, 'err');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    try {
      await apiRequest(`/tournaments/${id}`, 'DELETE');
      showMsg('Torneio excluído');
      onRefresh();
    } catch (err: any) {
      showMsg(err.message, 'err');
    } finally {
      setConfirmId(null);
    }
  }

  async function handleDefaultEvents(id: string) {
    try {
      const r = await apiRequest(`/tournaments/${id}/default-events`, 'POST');
      showMsg(`${r.count} eventos criados/verificados`);
      onRefresh();
    } catch (err: any) {
      showMsg(err.message, 'err');
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-6 items-start">
      {/* Form */}
      <div className="card p-6">
        <h2 className="font-display text-xl font-bold mb-5">Novo Torneio</h2>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="label">Nome do torneio *</label>
            <input className="input" placeholder="Ex: Arena Open 2025" value={name} onChange={e => setName(e.target.value)} required />
          </div>
          <div className="form-row form-row-2">
            <div>
              <label className="label">Estado</label>
              <select className="input" value={state} onChange={e => setState(e.target.value)}>
                <option value="">Selecionar</option>
                {ESTADOS_BR.map(e => <option key={e.uf} value={e.uf}>{e.uf} — {e.nome}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Cidade</label>
              {cidades.length > 0 ? (
                <select className="input" value={city} onChange={e => setCity(e.target.value)}>
                  <option value="">{loadingCities ? 'Carregando...' : 'Selecionar'}</option>
                  {cidades.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              ) : (
                <input className="input" placeholder={loadingCities ? 'Carregando...' : 'Cidade'} value={city} onChange={e => setCity(e.target.value)} disabled={loadingCities} />
              )}
            </div>
          </div>
          <div className="form-row form-row-2">
            <div>
              <label className="label">Data início *</label>
              <input className="input" type="date" value={start} onChange={e => setStart(e.target.value)} required />
            </div>
            <div>
              <label className="label">Data fim *</label>
              <input className="input" type="date" value={end} onChange={e => setEnd(e.target.value)} required />
            </div>
          </div>
          <button type="submit" className="btn btn-primary btn-lg mt-1" disabled={saving}>
            {saving ? <><span className="spinner" /> Salvando...</> : '+ Criar Torneio'}
          </button>
        </form>
      </div>

      {/* List */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-xl font-bold">Torneios <span className="text-[var(--text-muted)] font-normal text-base">({tournaments.length})</span></h2>
        </div>
        {tournaments.length === 0 ? (
          <div className="card">
            <div className="empty-state">
              <span className="empty-state-icon">🏆</span>
              <p className="font-semibold">Nenhum torneio cadastrado</p>
              <p className="text-sm text-[var(--text-faint)]">Crie o primeiro torneio no formulário ao lado</p>
            </div>
          </div>
        ) : (
          tournaments.map(t => {
            const info = STATUS_INFO[t.status] ?? STATUS_INFO.draft;
            return (
              <div key={t.id} className="card p-4 flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-[var(--text-primary)] truncate">{t.name}</span>
                    <span className={`badge ${info.cls}`}>{info.label}</span>
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-xs text-[var(--text-muted)]">
                    {(t.city || t.state) && <span>📍 {[t.city, t.state].filter(Boolean).join(', ')}</span>}
                    <span>📅 {t.startDate?.slice(0, 10)} → {t.endDate?.slice(0, 10)}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => handleDefaultEvents(t.id)}
                    className="btn btn-secondary btn-sm"
                    title="Gerar eventos padrão"
                  >
                    ⚡ Eventos
                  </button>
                  <a
                    href={`/torneios/${t.slug}`}
                    target="_blank"
                    className="btn btn-ghost btn-sm"
                    title="Ver chaveamento"
                  >
                    ↗ Ver
                  </a>
                  <button
                    onClick={() => setConfirmId(t.id)}
                    className="btn btn-danger btn-sm"
                    title="Excluir"
                  >
                    🗑
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {confirmId && (
        <ConfirmDialog
          title="Excluir torneio?"
          description="Esta ação não pode ser desfeita. Todos os dados do torneio serão removidos."
          confirmLabel="Excluir"
          onConfirm={() => handleDelete(confirmId)}
          onCancel={() => setConfirmId(null)}
        />
      )}
    </div>
  );
}
