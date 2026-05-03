'use client';
import { use, useEffect, useState } from 'react';
import { useAuth } from '../../../../../contexts/AuthContext';

type SetEntry = { setNumber: number; team1Games: number; team2Games: number; tieBreak1?: string; tieBreak2?: string };

type PageProps = { params: Promise<{ id: string }> };

export default function ScorePage({ params }: PageProps) {
  const { id } = use(params);
  const { authFetch } = useAuth();
  const [match, setMatch]         = useState<any>(null);
  const [loading, setLoading]     = useState(true);
  const [saving, setSaving]       = useState(false);
  const [msg, setMsg]             = useState('');
  const [msgType, setMsgType]     = useState<'ok' | 'err'>('ok');
  const [winnerTeamId, setWinner] = useState<string>('');
  const [sets, setSets]           = useState<SetEntry[]>([
    { setNumber: 1, team1Games: 0, team2Games: 0 },
    { setNumber: 2, team1Games: 0, team2Games: 0 },
  ]);

  useEffect(() => {
    authFetch(`/matches/${id}`)
      .then(r => r.json())
      .then(data => {
        setMatch(data);
        if (data.sets?.length) {
          setSets(data.sets.map((s: any) => ({
            setNumber:  s.setNumber,
            team1Games: s.team1Games ?? 0,
            team2Games: s.team2Games ?? 0,
            tieBreak1:  s.tieBreakTeam1 != null ? String(s.tieBreakTeam1) : '',
            tieBreak2:  s.tieBreakTeam2 != null ? String(s.tieBreakTeam2) : '',
          })));
        }
        if (data.winnerTeamId) setWinner(data.winnerTeamId);
      })
      .catch(() => { setMsg('Partida não encontrada'); setMsgType('err'); })
      .finally(() => setLoading(false));
  }, [id]);

  function updateSet(i: number, field: keyof SetEntry, value: string | number) {
    setSets(prev => prev.map((s, idx) => idx === i ? { ...s, [field]: value } : s));
  }

  function addSet() {
    setSets(prev => [...prev, { setNumber: prev.length + 1, team1Games: 0, team2Games: 0 }]);
  }

  function removeSet(i: number) {
    setSets(prev => prev.filter((_, idx) => idx !== i).map((s, idx) => ({ ...s, setNumber: idx + 1 })));
  }

  async function handleSubmit(e: { preventDefault(): void }) {
    e.preventDefault();
    if (!winnerTeamId) {
      setMsg('Selecione o time vencedor antes de salvar.');
      setMsgType('err');
      return;
    }
    setSaving(true);
    setMsg('');
    try {
      const loserTeamId = winnerTeamId === match?.team1Id ? match?.team2Id : match?.team1Id;
      const payload = {
        winnerTeamId,
        loserTeamId,
        sets: sets.map(s => ({
          setNumber:    s.setNumber,
          team1Games:   Number(s.team1Games),
          team2Games:   Number(s.team2Games),
          tieBreakTeam1: s.tieBreak1 !== '' && s.tieBreak1 != null ? Number(s.tieBreak1) : null,
          tieBreakTeam2: s.tieBreak2 !== '' && s.tieBreak2 != null ? Number(s.tieBreak2) : null,
        })),
      };
      const res = await authFetch(`/matches/${id}/result`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message ?? `Erro ${res.status}`);
      }
      setMsg('Resultado salvo! Chaveamento atualizado automaticamente.');
      setMsgType('ok');
    } catch (err: any) {
      setMsg(err.message ?? 'Erro ao salvar placar');
      setMsgType('err');
    } finally {
      setSaving(false);
    }
  }

  const team1Name = match?.team1
    ? `${match.team1.player1?.fullName ?? '?'}${match.team1.player2 ? ' / ' + match.team1.player2.fullName : ''}`
    : 'Time 1';
  const team2Name = match?.team2
    ? `${match.team2.player1?.fullName ?? '?'}${match.team2.player2 ? ' / ' + match.team2.player2.fullName : ''}`
    : 'Time 2';

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '1.5rem' }}>
      <div style={{ width: '100%', maxWidth: '520px' }}>
        <div style={{ marginBottom: '1.5rem' }}>
          <a href="/" style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textDecoration: 'none' }}>← Voltar ao painel</a>
          <h1 style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: '2rem', fontWeight: 800, color: 'var(--text-primary)', margin: '0.5rem 0 0.25rem' }}>
            Lançamento de Placar
          </h1>
          {match && <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', margin: 0 }}>Partida #{match.matchNumber} · {match.roundName}</p>}
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem 0' }}>
            <span className="spinner" style={{ width: '2rem', height: '2rem', borderWidth: '3px' }} />
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            {/* Sets */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem', marginBottom: '1.25rem' }}>
              {sets.map((s, i) => (
                <div key={i} className="card" style={{ padding: '1.25rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                    <span style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: '1rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                      SET {s.setNumber}
                    </span>
                    {sets.length > 1 && (
                      <button type="button" onClick={() => removeSet(i)} className="btn btn-ghost btn-sm" style={{ color: 'var(--accent-red)' }}>
                        ✕
                      </button>
                    )}
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 2.5rem 1fr', gap: '0.75rem', alignItems: 'end' }}>
                    <div>
                      <label className="label" style={{ textAlign: 'center' }}>{team1Name}</label>
                      <input
                        className="input"
                        type="number"
                        min="0"
                        max="99"
                        value={s.team1Games}
                        onChange={e => updateSet(i, 'team1Games', Number(e.target.value))}
                        style={{ textAlign: 'center', fontFamily: 'Barlow Condensed, sans-serif', fontSize: '1.5rem', fontWeight: 700 }}
                      />
                    </div>
                    <div style={{ textAlign: 'center', fontWeight: 800, color: 'var(--text-faint)', paddingBottom: '0.6rem' }}>–</div>
                    <div>
                      <label className="label" style={{ textAlign: 'center' }}>{team2Name}</label>
                      <input
                        className="input"
                        type="number"
                        min="0"
                        max="99"
                        value={s.team2Games}
                        onChange={e => updateSet(i, 'team2Games', Number(e.target.value))}
                        style={{ textAlign: 'center', fontFamily: 'Barlow Condensed, sans-serif', fontSize: '1.5rem', fontWeight: 700 }}
                      />
                    </div>
                  </div>
                  {/* Tie-break */}
                  <div style={{ marginTop: '0.75rem' }}>
                    <label className="label">Tie-break (opcional)</label>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 2.5rem 1fr', gap: '0.75rem', alignItems: 'center' }}>
                      <input className="input" type="number" min="0" placeholder="—" value={s.tieBreak1 ?? ''} onChange={e => updateSet(i, 'tieBreak1', e.target.value)} style={{ textAlign: 'center' }} />
                      <div style={{ textAlign: 'center', fontWeight: 800, color: 'var(--text-faint)' }}>–</div>
                      <input className="input" type="number" min="0" placeholder="—" value={s.tieBreak2 ?? ''} onChange={e => updateSet(i, 'tieBreak2', e.target.value)} style={{ textAlign: 'center' }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={addSet}
              className="btn btn-secondary"
              style={{ width: '100%', marginBottom: '1.25rem' }}
            >
              + Adicionar Set
            </button>

            {/* Winner selection */}
            <div className="card" style={{ padding: '1.25rem', marginBottom: '1.25rem' }}>
              <p style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 0.875rem' }}>
                Time Vencedor *
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {[{ id: match?.team1Id, name: team1Name }, { id: match?.team2Id, name: team2Name }].map(team => (
                  <label
                    key={team.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      padding: '0.875rem 1rem',
                      borderRadius: 'var(--radius-md)',
                      border: `2px solid ${winnerTeamId === team.id ? 'var(--accent-green, #00C850)' : 'var(--border-subtle)'}`,
                      background: winnerTeamId === team.id ? 'rgba(0,200,80,0.08)' : 'transparent',
                      cursor: 'pointer',
                      transition: 'all 0.15s',
                    }}
                  >
                    <input
                      type="radio"
                      name="winner"
                      value={team.id ?? ''}
                      checked={winnerTeamId === team.id}
                      onChange={() => setWinner(team.id ?? '')}
                      style={{ accentColor: 'var(--accent-green, #00C850)' }}
                    />
                    <span style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-primary)' }}>{team.name}</span>
                    {winnerTeamId === team.id && (
                      <span style={{ marginLeft: 'auto', fontSize: '0.75rem', fontWeight: 700, color: 'var(--accent-green, #00C850)', textTransform: 'uppercase' }}>
                        Vencedor
                      </span>
                    )}
                  </label>
                ))}
              </div>
            </div>

            {msg && (
              <div style={{
                padding: '0.75rem 1rem',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.875rem',
                marginBottom: '1rem',
                background: msgType === 'ok' ? 'rgba(0,200,80,0.1)' : 'rgba(255,64,96,0.1)',
                border: `1px solid ${msgType === 'ok' ? 'rgba(0,200,80,0.25)' : 'rgba(255,64,96,0.25)'}`,
                color: msgType === 'ok' ? '#00C850' : '#FF6080',
              }}>
                {msg}
              </div>
            )}

            <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%' }} disabled={saving}>
              {saving ? <><span className="spinner" /> Salvando...</> : '💾 Salvar Resultado'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
