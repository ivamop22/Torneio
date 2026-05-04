'use client';
import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../../../contexts/AuthContext';

type SetEntry = { setNumber: number; team1Games: number; team2Games: number };
type PageProps = { params: Promise<{ id: string }> };

export default function ScorePage({ params }: PageProps) {
  const { id } = use(params);
  const { authFetch } = useAuth();
  const router = useRouter();
  const [match, setMatch]   = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(false);
  const [saved, setSaved]     = useState(false);
  const [msg, setMsg]         = useState('');
  const [msgType, setMsgType] = useState<'ok' | 'err'>('ok');
  const [sets, setSets]       = useState<SetEntry[]>([
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
          })));
        }
        if (data.status === 'completed') setSaved(true);
      })
      .catch(() => { setMsg('Partida não encontrada'); setMsgType('err'); })
      .finally(() => setLoading(false));
  }, [id, authFetch]);

  // Auto-compute winner from set scores
  const t1Sets = sets.filter(s => s.team1Games > s.team2Games).length;
  const t2Sets = sets.filter(s => s.team2Games > s.team1Games).length;
  const winnerTeamId = t1Sets > t2Sets ? match?.team1Id : t2Sets > t1Sets ? match?.team2Id : null;

  function updateGames(i: number, field: 'team1Games' | 'team2Games', raw: string) {
    const n = Math.max(0, parseInt(raw) || 0);
    setSets(prev => prev.map((s, idx) => idx === i ? { ...s, [field]: n } : s));
    setSaved(false);
  }

  function addSet() {
    setSets(prev => [...prev, { setNumber: prev.length + 1, team1Games: 0, team2Games: 0 }]);
    setSaved(false);
  }

  function removeSet(i: number) {
    if (sets.length <= 1) return;
    setSets(prev => prev.filter((_, idx) => idx !== i).map((s, idx) => ({ ...s, setNumber: idx + 1 })));
    setSaved(false);
  }

  async function handleSave() {
    if (!winnerTeamId) {
      setMsg('Resultado indefinido — uma dupla deve ganhar mais sets.');
      setMsgType('err');
      return;
    }
    setSaving(true);
    setMsg('');
    try {
      const loserTeamId = winnerTeamId === match?.team1Id ? match?.team2Id : match?.team1Id;
      const res = await authFetch(`/matches/${id}/result`, {
        method: 'PATCH',
        body: JSON.stringify({
          winnerTeamId,
          loserTeamId,
          sets: sets.map(s => ({ setNumber: s.setNumber, team1Games: s.team1Games, team2Games: s.team2Games })),
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message ?? `Erro ${res.status}`);
      }
      setMsg('Resultado salvo! Redirecionando...');
      setMsgType('ok');
      setSaved(true);
      setTimeout(() => router.push('/?tab=chaveamento'), 1500);
    } catch (err: any) {
      setMsg(err.message ?? 'Erro ao salvar resultado');
      setMsgType('err');
    } finally {
      setSaving(false);
    }
  }

  const team1Name = match?.team1
    ? `${match.team1.player1?.fullName ?? '?'}${match.team1.player2 ? ' / ' + match.team1.player2.fullName : ''}`
    : 'Dupla 1';
  const team2Name = match?.team2
    ? `${match.team2.player1?.fullName ?? '?'}${match.team2.player2 ? ' / ' + match.team2.player2.fullName : ''}`
    : 'Dupla 2';

  if (loading) return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <span className="spinner" style={{ width: '2rem', height: '2rem', borderWidth: '3px' }} />
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)', padding: '1.5rem 1rem' }}>
      <div style={{ maxWidth: '480px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1rem' }}>

        {/* Back */}
        <button
          onClick={() => router.push('/?tab=chaveamento')}
          style={{ fontSize: '0.8rem', color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, textAlign: 'left' }}
        >
          ← Voltar ao chaveamento
        </button>

        {/* Title */}
        <h1 style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
          {match?.roundName ?? 'Lançar Resultado'}
          {match?.matchNumber ? <span style={{ color: 'var(--text-muted)', fontWeight: 400, fontSize: '1.1rem' }}> — Partida {match.matchNumber}</span> : null}
        </h1>

        {/* Team cards */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: '0.625rem', alignItems: 'center' }}>
          <div style={{
            background: 'var(--bg-surface)',
            border: `2px solid ${winnerTeamId === match?.team1Id ? 'rgba(180,255,61,0.5)' : 'var(--border)'}`,
            borderRadius: '0.75rem', padding: '1rem', textAlign: 'center',
          }}>
            <div style={{ fontSize: '0.6rem', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '0.375rem' }}>DUPLA 1</div>
            <div style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--text-primary)', lineHeight: 1.35 }}>{team1Name}</div>
          </div>
          <div style={{ fontWeight: 800, color: 'var(--text-faint)', fontSize: '0.85rem', padding: '0 0.25rem' }}>VS</div>
          <div style={{
            background: 'var(--bg-surface)',
            border: `2px solid ${winnerTeamId === match?.team2Id ? 'rgba(180,255,61,0.5)' : 'var(--border)'}`,
            borderRadius: '0.75rem', padding: '1rem', textAlign: 'center',
          }}>
            <div style={{ fontSize: '0.6rem', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '0.375rem' }}>DUPLA 2</div>
            <div style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--text-primary)', lineHeight: 1.35 }}>{team2Name}</div>
          </div>
        </div>

        {/* Set rows */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {sets.map((s, i) => {
            const t1Win = s.team1Games > s.team2Games;
            const t2Win = s.team2Games > s.team1Games;
            return (
              <div key={i} style={{
                display: 'grid', gridTemplateColumns: '3.5rem 1fr 2rem 1fr auto',
                gap: '0.5rem', alignItems: 'center',
                background: 'var(--bg-surface)', borderRadius: '0.625rem', padding: '0.75rem 1rem',
              }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                  Set {s.setNumber}
                </span>
                <input
                  type="number" min="0" max="99"
                  value={s.team1Games}
                  onChange={e => updateGames(i, 'team1Games', e.target.value)}
                  style={{
                    background: t1Win ? 'rgba(180,255,61,0.15)' : 'var(--bg-elevated)',
                    border: `2px solid ${t1Win ? 'rgba(180,255,61,0.45)' : 'var(--border)'}`,
                    borderRadius: '0.5rem',
                    color: t1Win ? 'var(--accent-lime)' : 'var(--text-primary)',
                    fontWeight: 800, fontSize: '1.35rem', textAlign: 'center',
                    padding: '0.5rem 0.25rem', width: '100%', outline: 'none',
                  }}
                />
                <span style={{ textAlign: 'center', color: 'var(--text-faint)', fontWeight: 700 }}>×</span>
                <input
                  type="number" min="0" max="99"
                  value={s.team2Games}
                  onChange={e => updateGames(i, 'team2Games', e.target.value)}
                  style={{
                    background: t2Win ? 'rgba(180,255,61,0.15)' : 'var(--bg-elevated)',
                    border: `2px solid ${t2Win ? 'rgba(180,255,61,0.45)' : 'var(--border)'}`,
                    borderRadius: '0.5rem',
                    color: t2Win ? 'var(--accent-lime)' : 'var(--text-primary)',
                    fontWeight: 800, fontSize: '1.35rem', textAlign: 'center',
                    padding: '0.5rem 0.25rem', width: '100%', outline: 'none',
                  }}
                />
                {sets.length > 2 ? (
                  <button
                    type="button" onClick={() => removeSet(i)}
                    style={{ background: 'none', border: 'none', color: 'var(--text-faint)', cursor: 'pointer', fontSize: '0.9rem', padding: '0.25rem', lineHeight: 1 }}
                    title="Remover set"
                  >✕</button>
                ) : <span />}
              </div>
            );
          })}
        </div>

        {/* Winner indicator */}
        {winnerTeamId && (
          <div style={{ textAlign: 'center', fontSize: '0.8rem', fontWeight: 700, color: 'var(--accent-lime)', letterSpacing: '0.04em' }}>
            Vencedor: {winnerTeamId === match?.team1Id ? team1Name : team2Name}
          </div>
        )}

        {/* Buttons */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '0.625rem' }}>
          <button type="button" onClick={addSet} className="btn btn-secondary">
            + Adicionar Set
          </button>
          <button
            type="button" onClick={handleSave}
            disabled={saving || !winnerTeamId}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
              fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 800, fontSize: '1rem',
              letterSpacing: '0.05em', borderRadius: '0.625rem', border: 'none', cursor: 'pointer',
              padding: '0.75rem 1rem', transition: 'all 0.15s',
              background: saved ? 'rgba(180,255,61,0.15)' : winnerTeamId ? 'var(--accent-lime)' : 'var(--bg-elevated)',
              color: saved ? 'var(--accent-lime)' : winnerTeamId ? '#050810' : 'var(--text-faint)',
              opacity: saving ? 0.7 : 1,
            }}
          >
            {saving
              ? <><span className="spinner" style={{ borderTopColor: '#050810' }} /> Salvando...</>
              : saved ? '✅ Salvo'
              : '✅ Salvar Resultado'
            }
          </button>
        </div>

        {/* Message */}
        {msg && (
          <div style={{
            padding: '0.75rem 1rem', borderRadius: '0.5rem', fontSize: '0.875rem',
            background: msgType === 'ok' ? 'rgba(180,255,61,0.1)' : 'rgba(255,64,96,0.1)',
            border: `1px solid ${msgType === 'ok' ? 'rgba(180,255,61,0.25)' : 'rgba(255,64,96,0.25)'}`,
            color: msgType === 'ok' ? 'var(--accent-lime)' : '#FF6080',
          }}>
            {msg}
          </div>
        )}
      </div>
    </div>
  );
}
