'use client';
import { useState } from 'react';

/* ─── Sidebar navigation ─────────────────────────────────────────────────── */

const SECTIONS = [
  { id: 'visao-geral',    label: 'Visao Geral',           num: '' },
  { id: 'torneio',        label: '1. Criar Torneio',       num: '1' },
  { id: 'evento',         label: '2. Criar Evento',        num: '2' },
  { id: 'jogadores',      label: '3. Cadastrar Jogadores', num: '3' },
  { id: 'duplas',         label: '4. Montar Duplas',       num: '4' },
  { id: 'chaveamento',    label: '5. Gerar Chaveamento',   num: '5' },
  { id: 'placares-grupo', label: '6. Lancamentos: Grupos', num: '6' },
  { id: 'automacao',      label: '7. Motor Automatico',    num: '7' },
  { id: 'placares-ko',    label: '8. Lancamentos: Mata-mata', num: '8' },
  { id: 'final',          label: '9. Final e Campeao',     num: '9' },
  { id: 'ao-vivo',        label: '10. Acompanhamento',     num: '10' },
];

/* ─── Primitive UI helpers ───────────────────────────────────────────────── */

function Step({ n, text }: { n: number; text: string }) {
  return (
    <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start', marginBottom: '0.875rem' }}>
      <div style={{
        width: 28, height: 28, borderRadius: '50%',
        background: 'var(--accent-lime)', color: '#06091A',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontWeight: 800, fontSize: '0.78rem', flexShrink: 0, marginTop: 1,
      }}>{n}</div>
      <p style={{ margin: '4px 0 0', color: 'var(--text-muted)', fontSize: '0.875rem', lineHeight: 1.65 }}>{text}</p>
    </div>
  );
}

function Tip({ text }: { text: string }) {
  return (
    <div style={{
      background: 'rgba(180,255,61,0.06)', border: '1px solid rgba(180,255,61,0.18)',
      borderRadius: 10, padding: '0.75rem 1rem', margin: '0.75rem 0',
      display: 'flex', gap: '0.6rem', alignItems: 'flex-start',
    }}>
      <span style={{ fontSize: '0.9rem', flexShrink: 0, marginTop: 1 }}>💡</span>
      <span style={{ fontSize: '0.83rem', color: 'var(--text-muted)', lineHeight: 1.55 }}>{text}</span>
    </div>
  );
}

function Warn({ text }: { text: string }) {
  return (
    <div style={{
      background: 'rgba(255,180,0,0.06)', border: '1px solid rgba(255,180,0,0.22)',
      borderRadius: 10, padding: '0.75rem 1rem', margin: '0.75rem 0',
      display: 'flex', gap: '0.6rem', alignItems: 'flex-start',
    }}>
      <span style={{ fontSize: '0.9rem', flexShrink: 0, marginTop: 1 }}>⚠️</span>
      <span style={{ fontSize: '0.83rem', color: 'var(--text-muted)', lineHeight: 1.55 }}>{text}</span>
    </div>
  );
}

function Result({ text }: { text: string }) {
  return (
    <div style={{
      background: 'rgba(61,158,255,0.06)', border: '1px solid rgba(61,158,255,0.2)',
      borderRadius: 10, padding: '0.75rem 1rem', margin: '0.75rem 0',
      display: 'flex', gap: '0.6rem', alignItems: 'flex-start',
    }}>
      <span style={{ fontSize: '0.9rem', flexShrink: 0, marginTop: 1 }}>✅</span>
      <span style={{ fontSize: '0.83rem', color: 'var(--text-muted)', lineHeight: 1.55 }}>
        <strong style={{ color: 'var(--accent-blue, #3D9EFF)', fontWeight: 700 }}>Resultado: </strong>
        {text}
      </span>
    </div>
  );
}

function SectionTitle({ id, num, title, subtitle }: { id: string; num?: string; title: string; subtitle: string }) {
  return (
    <div id={id} style={{ scrollMarginTop: 88, marginBottom: '1.5rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem', marginBottom: '0.375rem' }}>
        {num && (
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: 'rgba(180,255,61,0.12)', border: '1px solid rgba(180,255,61,0.28)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'Barlow Condensed, sans-serif', fontSize: '1rem', fontWeight: 900,
            color: 'var(--accent-lime)', flexShrink: 0,
          }}>{num}</div>
        )}
        <h2 style={{
          fontFamily: 'Barlow Condensed, sans-serif', fontSize: '1.9rem',
          fontWeight: 800, color: 'var(--text-primary)', margin: 0, lineHeight: 1,
        }}>{title}</h2>
      </div>
      <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', margin: 0, paddingLeft: num ? '3.125rem' : 0, lineHeight: 1.55 }}>{subtitle}</p>
    </div>
  );
}

function Divider() {
  return <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '2.5rem 0' }} />;
}

/* ─── Mockup primitives ──────────────────────────────────────────────────── */

function MockScreen({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{
      border: '1px solid var(--border)', borderRadius: 14, overflow: 'hidden',
      margin: '1.5rem 0', boxShadow: '0 8px 32px rgba(0,0,0,0.28)',
    }}>
      {/* Window chrome */}
      <div style={{
        background: 'rgba(255,255,255,0.03)', padding: '0.55rem 1rem',
        borderBottom: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', gap: '0.5rem',
      }}>
        <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#ff5f57' }} />
        <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#febc2e' }} />
        <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#28c840' }} />
        <span style={{ fontSize: '0.7rem', color: 'var(--text-faint)', marginLeft: '0.6rem', letterSpacing: '0.01em' }}>{title}</span>
      </div>
      <div style={{ background: 'var(--bg-base)', padding: '1.25rem' }}>{children}</div>
    </div>
  );
}

function MockCard({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{
      background: 'var(--bg-card)', border: '1px solid var(--border)',
      borderRadius: 10, padding: '0.875rem',
      ...style,
    }}>{children}</div>
  );
}

function MockNav({ active }: { active: string }) {
  const tabs = ['Torneios', 'Eventos', 'Jogadores', 'Duplas', 'Chaveamento'];
  return (
    <div style={{
      background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid var(--border)',
      padding: '0 0.5rem', display: 'flex', gap: '0.1rem', overflowX: 'auto',
    }}>
      {tabs.map(t => (
        <div key={t} style={{
          padding: '0.625rem 0.9rem', fontSize: '0.77rem', fontWeight: 600,
          color: t === active ? 'var(--accent-lime)' : 'var(--text-muted)',
          borderBottom: t === active ? '2px solid var(--accent-lime)' : '2px solid transparent',
          whiteSpace: 'nowrap',
        }}>{t}</div>
      ))}
    </div>
  );
}

function MockInput({ label, value, placeholder }: { label: string; value?: string; placeholder?: string }) {
  return (
    <div style={{ marginBottom: '0.65rem' }}>
      <div style={{
        fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-muted)',
        marginBottom: 3, textTransform: 'uppercase', letterSpacing: '0.06em',
      }}>{label}</div>
      <div style={{
        background: 'var(--bg-surface)', border: '1px solid var(--border)',
        borderRadius: 8, padding: '7px 11px', fontSize: '0.82rem',
        color: value ? 'var(--text-primary)' : 'var(--text-faint)',
      }}>{value || placeholder || ''}</div>
    </div>
  );
}

function MockBtn({ label, primary, danger, small }: { label: string; primary?: boolean; danger?: boolean; small?: boolean }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center',
      padding: small ? '4px 10px' : '7px 14px',
      borderRadius: 8, fontSize: small ? '0.72rem' : '0.79rem', fontWeight: 700,
      cursor: 'pointer', whiteSpace: 'nowrap',
      background: primary ? 'var(--accent-lime)' : danger ? 'rgba(255,64,96,0.14)' : 'rgba(255,255,255,0.06)',
      color: primary ? '#06091A' : danger ? '#FF6080' : 'var(--text-muted)',
      border: primary ? 'none' : danger ? '1px solid rgba(255,64,96,0.28)' : '1px solid var(--border)',
    }}>{label}</span>
  );
}

function MockBadge({ label, color }: { label: string; color: string }) {
  return (
    <span style={{
      background: color + '20', color,
      border: `1px solid ${color}40`, borderRadius: 99,
      padding: '2px 9px', fontSize: '0.67rem', fontWeight: 700,
      textTransform: 'uppercase', letterSpacing: '0.06em',
    }}>{label}</span>
  );
}

/* ─── Section-specific mockups ───────────────────────────────────────────── */

function BracketGroupsMockup() {
  const groups = [
    {
      name: 'GRUPO A',
      standings: [
        { pos: '1', dupla: '#1 Carlos / Pedro', j: 2, v: 2, d: 0, pts: 6 },
        { pos: '2', dupla: '#4 Thiago / Lucas',  j: 2, v: 1, d: 1, pts: 3 },
        { pos: '3', dupla: '#5 Felipe / André',  j: 2, v: 0, d: 2, pts: 0 },
      ],
      matches: [
        { num: 1, t1: 'Carlos / Pedro',  t2: 'Felipe / André',  status: 'completed', score: '6-3  6-2' },
        { num: 2, t1: 'Thiago / Lucas',  t2: 'Felipe / André',  status: 'completed', score: '6-4  6-1' },
        { num: 3, t1: 'Carlos / Pedro',  t2: 'Thiago / Lucas',  status: 'scheduled', score: '' },
      ],
    },
    {
      name: 'GRUPO B',
      standings: [
        { pos: '1', dupla: '#2 Joao / Rafael',  j: 1, v: 1, d: 0, pts: 3 },
        { pos: '2', dupla: '#3 Marcos / Bruno', j: 1, v: 0, d: 1, pts: 0 },
      ],
      matches: [
        { num: 4, t1: 'Joao / Rafael', t2: 'Marcos / Bruno', status: 'scheduled', score: '' },
      ],
    },
  ];

  return (
    <MockScreen title="painel.arenabeachtennis.com.br — Chaveamento">
      <MockNav active="Chaveamento" />
      <div style={{ padding: '0.875rem 0', display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
        {/* Event selector row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{
            background: 'var(--bg-surface)', border: '1px solid var(--border)',
            borderRadius: 8, padding: '7px 12px', fontSize: '0.8rem',
            color: 'var(--text-primary)', flex: 1,
          }}>Masculino Adulto A</div>
          <MockBadge label="Live" color="#FF4060" />
        </div>

        {groups.map(g => (
          <div key={g.name} style={{
            background: 'var(--bg-card)', border: '1px solid var(--border)',
            borderRadius: 10, overflow: 'hidden',
          }}>
            {/* Group header */}
            <div style={{
              padding: '0.5rem 1rem', background: 'rgba(180,255,61,0.05)',
              borderBottom: '1px solid var(--border)',
              fontSize: '0.7rem', fontWeight: 800, color: 'var(--accent-lime)',
              letterSpacing: '0.1em',
            }}>{g.name}</div>

            {/* Standings table */}
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.75rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  {['#', 'Dupla', 'J', 'V', 'D', 'Pts'].map(h => (
                    <th key={h} style={{
                      padding: '0.4rem 0.75rem', textAlign: h === 'Dupla' ? 'left' : 'center',
                      color: 'var(--text-faint)', fontWeight: 700, fontSize: '0.65rem',
                      textTransform: 'uppercase', letterSpacing: '0.07em',
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {g.standings.map((row, i) => (
                  <tr key={row.dupla} style={{ borderBottom: '1px solid rgba(28,45,80,0.5)' }}>
                    <td style={{ padding: '0.45rem 0.75rem', textAlign: 'center', color: 'var(--text-faint)', fontWeight: 700 }}>{row.pos}</td>
                    <td style={{ padding: '0.45rem 0.75rem', color: i < 2 ? 'var(--text-primary)' : 'var(--text-muted)', fontWeight: i < 2 ? 600 : 400, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      {i < 2 && <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--accent-lime)', display: 'inline-block', flexShrink: 0 }} />}
                      {row.dupla}
                    </td>
                    <td style={{ padding: '0.45rem 0.75rem', textAlign: 'center', color: 'var(--text-muted)' }}>{row.j}</td>
                    <td style={{ padding: '0.45rem 0.75rem', textAlign: 'center', color: '#22c55e', fontWeight: 700 }}>{row.v}</td>
                    <td style={{ padding: '0.45rem 0.75rem', textAlign: 'center', color: 'var(--text-faint)' }}>{row.d}</td>
                    <td style={{ padding: '0.45rem 0.75rem', textAlign: 'center', fontWeight: 800, color: 'var(--text-primary)' }}>{row.pts}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Match rows */}
            <div style={{ padding: '0.5rem 0.75rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              {g.matches.map(m => (
                <div key={m.num} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem' }}>
                  <span style={{ color: 'var(--text-faint)', minWidth: 24, fontWeight: 700 }}>#{m.num}</span>
                  <span style={{ flex: 1, color: 'var(--text-primary)' }}>{m.t1}</span>
                  <span style={{
                    fontSize: '0.62rem', fontWeight: 700, padding: '0.1rem 0.35rem',
                    background: 'var(--bg-elevated)', color: 'var(--text-faint)', borderRadius: 4,
                  }}>VS</span>
                  <span style={{ flex: 1, textAlign: 'right', color: 'var(--text-primary)' }}>{m.t2}</span>
                  {m.status === 'completed' ? (
                    <span style={{
                      fontSize: '0.66rem', fontWeight: 700, padding: '0.15rem 0.5rem',
                      background: 'rgba(180,255,61,0.12)', color: 'var(--accent-lime)',
                      border: '1px solid rgba(180,255,61,0.25)', borderRadius: 4,
                    }}>{m.score}</span>
                  ) : (
                    <a href="#" style={{
                      fontSize: '0.66rem', fontWeight: 700, padding: '0.2rem 0.55rem',
                      background: 'rgba(180,255,61,0.1)', color: 'var(--accent-lime)',
                      border: '1px solid rgba(180,255,61,0.28)', borderRadius: 4,
                      textDecoration: 'none', whiteSpace: 'nowrap',
                    }}>Lancar Placar →</a>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}

        <div style={{ fontSize: '0.68rem', color: 'var(--text-faint)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--accent-lime)', display: 'inline-block' }} />
          Classificados para o mata-mata
        </div>
      </div>
    </MockScreen>
  );
}

function ScoreEntryMockup() {
  return (
    <MockScreen title="painel.arenabeachtennis.com.br — Lancamento de Placar">
      <div style={{ maxWidth: 480, margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: '1.25rem' }}>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
            Partida #3 · Grupo A
          </div>
          <div style={{
            fontFamily: 'Barlow Condensed, sans-serif', fontSize: '1.6rem',
            fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1,
          }}>Lancamento de Placar</div>
        </div>

        {/* Sets */}
        {[
          { n: 1, g1: 6, g2: 3, tb1: '', tb2: '' },
          { n: 2, g1: 6, g2: 4, tb1: '', tb2: '' },
        ].map((s) => (
          <MockCard key={s.n} style={{ marginBottom: '0.75rem' }}>
            <div style={{
              fontSize: '0.68rem', fontWeight: 800, color: 'var(--text-muted)',
              textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.75rem',
            }}>SET {s.n}</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 36px 1fr', gap: '0.6rem', alignItems: 'end' }}>
              {/* Team 1 games */}
              <div>
                <div style={{
                  fontSize: '0.66rem', fontWeight: 700, color: 'var(--text-muted)',
                  textAlign: 'center', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4,
                }}>Carlos / Pedro</div>
                <div style={{
                  background: 'rgba(180,255,61,0.1)', border: '1px solid rgba(180,255,61,0.3)',
                  borderRadius: 8, padding: '8px 12px',
                  textAlign: 'center', fontFamily: 'Barlow Condensed, sans-serif',
                  fontSize: '1.6rem', fontWeight: 800, color: 'var(--accent-lime)',
                }}>{s.g1}</div>
              </div>
              <div style={{
                textAlign: 'center', fontWeight: 800,
                color: 'var(--text-faint)', paddingBottom: '0.5rem', fontSize: '1rem',
              }}>–</div>
              {/* Team 2 games */}
              <div>
                <div style={{
                  fontSize: '0.66rem', fontWeight: 700, color: 'var(--text-muted)',
                  textAlign: 'center', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4,
                }}>Thiago / Lucas</div>
                <div style={{
                  background: 'var(--bg-surface)', border: '1px solid var(--border)',
                  borderRadius: 8, padding: '8px 12px',
                  textAlign: 'center', fontFamily: 'Barlow Condensed, sans-serif',
                  fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-muted)',
                }}>{s.g2}</div>
              </div>
            </div>
            {/* Tiebreak row */}
            <div style={{ marginTop: '0.6rem' }}>
              <div style={{
                fontSize: '0.66rem', fontWeight: 700, color: 'var(--text-faint)',
                textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4,
              }}>Tie-break (opcional)</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 36px 1fr', gap: '0.6rem', alignItems: 'center' }}>
                <div style={{
                  background: 'var(--bg-surface)', border: '1px solid var(--border)',
                  borderRadius: 8, padding: '6px 10px', textAlign: 'center',
                  fontSize: '0.82rem', color: 'var(--text-faint)',
                }}>—</div>
                <div style={{ textAlign: 'center', color: 'var(--text-faint)', fontWeight: 700 }}>–</div>
                <div style={{
                  background: 'var(--bg-surface)', border: '1px solid var(--border)',
                  borderRadius: 8, padding: '6px 10px', textAlign: 'center',
                  fontSize: '0.82rem', color: 'var(--text-faint)',
                }}>—</div>
              </div>
            </div>
          </MockCard>
        ))}

        {/* Add set button */}
        <div style={{ marginBottom: '0.875rem' }}>
          <MockBtn label="+ Adicionar Set" />
        </div>

        {/* Winner selection */}
        <MockCard style={{ marginBottom: '0.875rem' }}>
          <div style={{
            fontSize: '0.68rem', fontWeight: 800, color: 'var(--text-muted)',
            textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.75rem',
          }}>Time Vencedor *</div>
          {[
            { name: 'Carlos / Pedro', winner: true },
            { name: 'Thiago / Lucas', winner: false },
          ].map(team => (
            <div key={team.name} style={{
              display: 'flex', alignItems: 'center', gap: '0.75rem',
              padding: '0.75rem 0.875rem', borderRadius: 10, marginBottom: '0.4rem',
              border: `2px solid ${team.winner ? 'rgba(0,200,80,0.6)' : 'var(--border)'}`,
              background: team.winner ? 'rgba(0,200,80,0.07)' : 'transparent',
            }}>
              <div style={{
                width: 16, height: 16, borderRadius: '50%',
                border: `2px solid ${team.winner ? '#00C850' : 'var(--border)'}`,
                background: team.winner ? '#00C850' : 'transparent',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
                {team.winner && <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#06091A' }} />}
              </div>
              <span style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-primary)' }}>{team.name}</span>
              {team.winner && (
                <span style={{
                  marginLeft: 'auto', fontSize: '0.68rem', fontWeight: 700,
                  color: '#00C850', textTransform: 'uppercase', letterSpacing: '0.05em',
                }}>Vencedor</span>
              )}
            </div>
          ))}
        </MockCard>

        <MockBtn label="Salvar Resultado" primary />
      </div>
    </MockScreen>
  );
}

function KnockoutBracketMockup() {
  return (
    <MockScreen title="painel.arenabeachtennis.com.br — Mata-mata">
      <div style={{ padding: '0.5rem 0' }}>
        <div style={{
          fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)',
          textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '1.25rem',
        }}>Fase Eliminatoria — Masculino Adulto A</div>

        {/* Layout: Semi | connector | Final | connector | Champion */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0', overflowX: 'auto' }}>

          {/* Semis column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', minWidth: 200 }}>
            {/* SF1 */}
            <div style={{
              background: 'var(--bg-card)', border: '1px solid var(--border)',
              borderRadius: 10, overflow: 'hidden', minWidth: 190,
            }}>
              <div style={{
                padding: '0.35rem 0.75rem', background: 'rgba(255,255,255,0.03)',
                borderBottom: '1px solid var(--border)', fontSize: '0.62rem',
                fontWeight: 700, color: 'var(--text-faint)', letterSpacing: '0.08em',
                textTransform: 'uppercase',
              }}>Semifinal 1</div>
              {[
                { name: '#1 Carlos / Pedro', winner: true,  score: '6-4  7-5' },
                { name: '#3 Marcos / Bruno', winner: false, score: '4-6  5-7' },
              ].map(t => (
                <div key={t.name} style={{
                  padding: '0.55rem 0.75rem', display: 'flex',
                  justifyContent: 'space-between', alignItems: 'center',
                  borderBottom: '1px solid rgba(28,45,80,0.5)',
                  background: t.winner ? 'rgba(180,255,61,0.05)' : 'transparent',
                }}>
                  <span style={{
                    fontSize: '0.76rem', fontWeight: t.winner ? 700 : 400,
                    color: t.winner ? 'var(--text-primary)' : 'var(--text-muted)',
                  }}>{t.name}</span>
                  <span style={{
                    fontSize: '0.72rem', fontWeight: 700,
                    color: t.winner ? 'var(--accent-lime)' : 'var(--text-faint)',
                    fontFamily: 'Barlow Condensed, sans-serif',
                  }}>{t.score}</span>
                </div>
              ))}
            </div>

            {/* SF2 */}
            <div style={{
              background: 'var(--bg-card)', border: '1px solid var(--border)',
              borderRadius: 10, overflow: 'hidden', minWidth: 190,
            }}>
              <div style={{
                padding: '0.35rem 0.75rem', background: 'rgba(255,255,255,0.03)',
                borderBottom: '1px solid var(--border)', fontSize: '0.62rem',
                fontWeight: 700, color: 'var(--text-faint)', letterSpacing: '0.08em',
                textTransform: 'uppercase',
              }}>Semifinal 2</div>
              {[
                { name: '#2 Joao / Rafael',  winner: true,  score: '6-3  6-2' },
                { name: '#4 Thiago / Lucas', winner: false, score: '3-6  2-6' },
              ].map(t => (
                <div key={t.name} style={{
                  padding: '0.55rem 0.75rem', display: 'flex',
                  justifyContent: 'space-between', alignItems: 'center',
                  borderBottom: '1px solid rgba(28,45,80,0.5)',
                  background: t.winner ? 'rgba(180,255,61,0.05)' : 'transparent',
                }}>
                  <span style={{
                    fontSize: '0.76rem', fontWeight: t.winner ? 700 : 400,
                    color: t.winner ? 'var(--text-primary)' : 'var(--text-muted)',
                  }}>{t.name}</span>
                  <span style={{
                    fontSize: '0.72rem', fontWeight: 700,
                    color: t.winner ? 'var(--accent-lime)' : 'var(--text-faint)',
                    fontFamily: 'Barlow Condensed, sans-serif',
                  }}>{t.score}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Connector lines (semi → final) */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 36, height: 210, position: 'relative', flexShrink: 0 }}>
            <div style={{ width: 1, height: '50%', background: 'var(--border)', position: 'absolute', right: 0, top: '25%' }} />
            <div style={{ width: 18, height: 1, background: 'var(--border)', position: 'absolute', right: 0, top: '25%' }} />
            <div style={{ width: 18, height: 1, background: 'var(--border)', position: 'absolute', right: 0, top: '75%' }} />
            <div style={{ width: 18, height: 1, background: 'var(--border)', position: 'absolute', right: 0, top: '50%' }} />
          </div>

          {/* Final */}
          <div style={{
            background: 'var(--bg-card)',
            border: '1px solid rgba(255,209,74,0.35)',
            boxShadow: '0 0 20px rgba(255,209,74,0.1)',
            borderRadius: 10, overflow: 'hidden', minWidth: 210,
          }}>
            <div style={{
              padding: '0.35rem 0.75rem',
              background: 'rgba(255,209,74,0.08)',
              borderBottom: '1px solid rgba(255,209,74,0.25)',
              fontSize: '0.62rem', fontWeight: 800, color: '#FFD14A',
              letterSpacing: '0.1em', textTransform: 'uppercase',
            }}>Final</div>
            {[
              { name: '#1 Carlos / Pedro', winner: true,  score: '7-5  6-3' },
              { name: '#2 Joao / Rafael',  winner: false, score: '5-7  3-6' },
            ].map(t => (
              <div key={t.name} style={{
                padding: '0.6rem 0.75rem', display: 'flex',
                justifyContent: 'space-between', alignItems: 'center',
                borderBottom: '1px solid rgba(28,45,80,0.5)',
                background: t.winner ? 'rgba(255,209,74,0.06)' : 'transparent',
              }}>
                <span style={{
                  fontSize: '0.78rem', fontWeight: t.winner ? 800 : 400,
                  color: t.winner ? 'var(--text-primary)' : 'var(--text-muted)',
                  display: 'flex', alignItems: 'center', gap: '0.35rem',
                }}>
                  {t.winner && <span style={{ fontSize: '0.8rem' }}>🏆</span>}
                  {t.name}
                </span>
                <span style={{
                  fontSize: '0.75rem', fontWeight: 700,
                  color: t.winner ? '#FFD14A' : 'var(--text-faint)',
                  fontFamily: 'Barlow Condensed, sans-serif',
                }}>{t.score}</span>
              </div>
            ))}
          </div>

          {/* Connector + Champion badge */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 36, flexShrink: 0 }}>
            <div style={{ width: 24, height: 1, background: 'rgba(255,209,74,0.4)' }} />
          </div>

          <div style={{
            background: 'rgba(255,209,74,0.08)', border: '1px solid rgba(255,209,74,0.35)',
            borderRadius: 10, padding: '0.75rem 1rem', minWidth: 120, textAlign: 'center',
          }}>
            <div style={{ fontSize: '1.4rem', marginBottom: '0.25rem' }}>🏆</div>
            <div style={{ fontSize: '0.62rem', fontWeight: 700, color: '#FFD14A', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Campea</div>
            <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '0.2rem', lineHeight: 1.3 }}>Carlos / Pedro</div>
          </div>
        </div>
      </div>
    </MockScreen>
  );
}

function AutomationDiagramMockup() {
  return (
    <MockScreen title="Motor de Automacao — pos-lancamento de placar">
      <div style={{ padding: '0.25rem 0' }}>
        {/* Trigger */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0 }}>
          <div style={{
            background: 'rgba(61,158,255,0.1)', border: '1px solid rgba(61,158,255,0.3)',
            borderRadius: 8, padding: '0.6rem 1.25rem', fontSize: '0.8rem', fontWeight: 700,
            color: '#3D9EFF', textAlign: 'center',
          }}>
            Todas as partidas do grupo concluidas
          </div>

          <div style={{ width: 1, height: 20, background: 'var(--border)' }} />
          <div style={{ fontSize: '0.75rem', color: 'var(--text-faint)' }}>v</div>
          <div style={{ width: 1, height: 12, background: 'var(--border)' }} />

          {/* Engine steps */}
          {[
            { icon: '📊', label: 'Recalcula classificacao dos grupos' },
            { icon: '🔀', label: 'Ordena: 1°A, 2°A, 1°B, 2°B...' },
            { icon: '🎯', label: 'Gera partidas do mata-mata: A1 vs B2 / B1 vs A2' },
            { icon: '📅', label: 'Agenda Semifinal 1 e Semifinal 2' },
          ].map((step, i) => (
            <div key={step.label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0, width: '100%' }}>
              <div style={{
                background: 'var(--bg-card)', border: '1px solid var(--border)',
                borderRadius: 8, padding: '0.55rem 1rem',
                display: 'flex', alignItems: 'center', gap: '0.6rem',
                fontSize: '0.8rem', color: 'var(--text-muted)', width: '100%', maxWidth: 440,
              }}>
                <span style={{ fontSize: '1rem', flexShrink: 0 }}>{step.icon}</span>
                {step.label}
              </div>
              {i < 3 && (
                <>
                  <div style={{ width: 1, height: 16, background: 'var(--border)' }} />
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-faint)' }}>v</div>
                  <div style={{ width: 1, height: 8, background: 'var(--border)' }} />
                </>
              )}
            </div>
          ))}

          <div style={{ width: 1, height: 20, background: 'var(--border)' }} />
          <div style={{ fontSize: '0.75rem', color: 'var(--text-faint)' }}>v</div>
          <div style={{ width: 1, height: 12, background: 'var(--border)' }} />

          {/* Result */}
          <div style={{
            background: 'rgba(180,255,61,0.08)', border: '1px solid rgba(180,255,61,0.3)',
            borderRadius: 8, padding: '0.6rem 1.25rem', fontSize: '0.8rem', fontWeight: 700,
            color: 'var(--accent-lime)', textAlign: 'center',
          }}>
            Mata-mata disponivel — partidas aparecem no chaveamento
          </div>
        </div>
      </div>
    </MockScreen>
  );
}

function PublicViewMockup() {
  return (
    <MockScreen title="arenabeachtennis.com.br/torneios/gwm-arena-open-2025">
      <div style={{ padding: '0.25rem 0' }}>
        {/* Tournament header */}
        <div style={{ marginBottom: '1rem' }}>
          <div style={{
            fontFamily: 'Barlow Condensed, sans-serif', fontSize: '1.5rem',
            fontWeight: 900, color: 'var(--text-primary)', marginBottom: '0.25rem',
          }}>GWM Arena Open 2025</div>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <MockBadge label="Live" color="#FF4060" />
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Curitiba, PR · 15–17 Jun 2025</span>
          </div>
        </div>

        {/* Sub-tabs */}
        <div style={{
          display: 'flex', gap: 0, borderBottom: '1px solid var(--border)',
          marginBottom: '1rem',
        }}>
          {['Grupos', 'Bracket', 'Ao Vivo', 'Ranking'].map((t, i) => (
            <div key={t} style={{
              padding: '0.5rem 0.875rem', fontSize: '0.77rem', fontWeight: i === 2 ? 700 : 500,
              color: i === 2 ? 'var(--accent-lime)' : 'var(--text-muted)',
              borderBottom: i === 2 ? '2px solid var(--accent-lime)' : '2px solid transparent',
            }}>{t}</div>
          ))}
        </div>

        {/* Live matches */}
        <div style={{ marginBottom: '0.875rem' }}>
          <div style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.5rem' }}>Em andamento</div>
          <MockCard style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.4rem' }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#FF4060', flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)' }}>Carlos / Pedro vs Thiago / Lucas</div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Grupo A · Partida #3</div>
            </div>
            <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: '1.1rem', fontWeight: 800, color: 'var(--accent-lime)' }}>3 – 1</div>
          </MockCard>
        </div>

        <div>
          <div style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.5rem' }}>Resultados recentes</div>
          {[
            { duplas: 'Carlos / Pedro vs Felipe / Andre', placar: '6-3  6-2', grupo: 'Grupo A · Partida #1' },
            { duplas: 'Thiago / Lucas vs Felipe / Andre', placar: '6-4  6-1', grupo: 'Grupo A · Partida #2' },
          ].map(m => (
            <MockCard key={m.duplas} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.4rem', opacity: 0.9 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{m.duplas}</div>
                <div style={{ fontSize: '0.68rem', color: 'var(--text-faint)' }}>{m.grupo}</div>
              </div>
              <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: '0.9rem', fontWeight: 700, color: 'var(--accent-lime)' }}>{m.placar}</div>
            </MockCard>
          ))}
        </div>

        <div style={{ marginTop: '0.75rem', padding: '0.6rem 0.875rem', background: 'rgba(180,255,61,0.05)', border: '1px solid rgba(180,255,61,0.15)', borderRadius: 8, fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ color: 'var(--accent-lime)', fontWeight: 700 }}>Nenhum login necessario</span> — compartilhe o link com atletas e espectadores.
        </div>
      </div>
    </MockScreen>
  );
}

/* ─── Main page ──────────────────────────────────────────────────────────── */

export default function AjudaPage() {
  const [activeSection, setActiveSection] = useState('visao-geral');

  function scrollTo(id: string) {
    setActiveSection(id);
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-base)' }}>

      {/* ── Sidebar ── */}
      <aside style={{
        width: 248, flexShrink: 0, position: 'sticky', top: 0,
        height: '100vh', overflowY: 'auto',
        borderRight: '1px solid var(--border)', background: 'var(--bg-card)',
        padding: '1.5rem 0',
      }}>
        <div style={{ padding: '0 1.25rem 1.25rem', borderBottom: '1px solid var(--border)', marginBottom: '0.625rem' }}>
          <div style={{
            fontFamily: 'Barlow Condensed, sans-serif', fontSize: '1.1rem',
            fontWeight: 800, color: 'var(--accent-lime)',
          }}>Manual do Sistema</div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-faint)', marginTop: 2 }}>Arena Beach Tennis</div>
        </div>

        {SECTIONS.map(s => (
          <button
            key={s.id}
            onClick={() => scrollTo(s.id)}
            style={{
              width: '100%', textAlign: 'left', background: 'transparent',
              border: 'none',
              borderLeft: activeSection === s.id ? '3px solid var(--accent-lime)' : '3px solid transparent',
              padding: '0.55rem 1.25rem', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: '0.5rem',
              fontSize: '0.8rem', lineHeight: 1.3,
              fontWeight: activeSection === s.id ? 700 : 400,
              color: activeSection === s.id ? 'var(--accent-lime)' : 'var(--text-muted)',
              background: activeSection === s.id ? 'rgba(180,255,61,0.07)' : 'transparent',
            }}
          >
            {s.num && (
              <span style={{
                width: 20, height: 20, borderRadius: 5, flexShrink: 0,
                background: activeSection === s.id ? 'rgba(180,255,61,0.2)' : 'rgba(255,255,255,0.05)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '0.65rem', fontWeight: 800,
                color: activeSection === s.id ? 'var(--accent-lime)' : 'var(--text-faint)',
              }}>{s.num}</span>
            )}
            {s.label}
          </button>
        ))}

        <div style={{ padding: '1.25rem', borderTop: '1px solid var(--border)', marginTop: '0.625rem' }}>
          <a href="/" style={{
            display: 'block', textAlign: 'center', padding: '8px',
            background: 'rgba(255,255,255,0.04)', borderRadius: 8,
            fontSize: '0.77rem', color: 'var(--text-muted)', textDecoration: 'none',
            border: '1px solid var(--border)',
          }}>← Voltar ao painel</a>
        </div>
      </aside>

      {/* ── Main content ── */}
      <main style={{ flex: 1, padding: '2.75rem 3rem 4rem', maxWidth: 880, overflowY: 'auto' }}>

        {/* ═══════════════════════════════════════════════════════════
            HERO — Visao Geral
        ═══════════════════════════════════════════════════════════ */}
        <div id="visao-geral" style={{ scrollMarginTop: 88, marginBottom: '3rem' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
            background: 'rgba(180,255,61,0.1)', border: '1px solid rgba(180,255,61,0.22)',
            borderRadius: 20, padding: '4px 14px', fontSize: '0.7rem',
            fontWeight: 700, color: 'var(--accent-lime)', marginBottom: '1rem', letterSpacing: '0.05em',
          }}>GUIA COMPLETO</div>

          <h1 style={{
            fontFamily: 'Barlow Condensed, sans-serif', fontSize: '3rem', fontWeight: 900,
            color: 'var(--text-primary)', margin: '0 0 0.875rem', lineHeight: 1.05,
          }}>
            Como organizar um torneio<br />
            <span style={{ color: 'var(--accent-lime)' }}>do zero ate o campea</span>
          </h1>

          <p style={{
            color: 'var(--text-muted)', fontSize: '1rem', lineHeight: 1.7,
            marginBottom: '2rem', maxWidth: 620,
          }}>
            Este guia cobre o fluxo completo de gestao de torneios de beach tennis — desde
            a criacao do torneio ate a declaracao do campeao. Siga as etapas na ordem. Cada
            secao traz a descricao, os passos exatos na interface e um mockup da tela.
          </p>

          {/* Flow strip */}
          <div style={{ display: 'flex', gap: '0.375rem', flexWrap: 'wrap', alignItems: 'center', marginBottom: '2rem' }}>
            {[
              'Torneio', 'Evento', 'Jogadores', 'Duplas', 'Chaveamento',
              'Placares Grupo', 'Motor Auto.', 'Placares KO', 'Final', 'Ao Vivo',
            ].map((s, i, arr) => (
              <div key={s} style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                <div style={{
                  background: 'var(--bg-card)', border: '1px solid var(--border)',
                  borderRadius: 7, padding: '5px 11px', fontSize: '0.75rem',
                  fontWeight: 600, color: 'var(--text-muted)',
                }}>{s}</div>
                {i < arr.length - 1 && (
                  <span style={{ color: 'var(--text-faint)', fontSize: '0.8rem' }}>→</span>
                )}
              </div>
            ))}
          </div>

          {/* Quick stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem' }}>
            {[
              { value: '10', label: 'Etapas documentadas' },
              { value: '3',  label: 'Mockups de interface' },
              { value: '1',  label: 'Fluxo completo garantido' },
            ].map(stat => (
              <div key={stat.label} style={{
                background: 'var(--bg-card)', border: '1px solid var(--border)',
                borderRadius: 10, padding: '0.875rem 1rem',
              }}>
                <div style={{
                  fontFamily: 'Barlow Condensed, sans-serif', fontSize: '1.75rem',
                  fontWeight: 800, color: 'var(--accent-lime)', lineHeight: 1,
                }}>{stat.value}</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>{stat.label}</div>
              </div>
            ))}
          </div>
        </div>

        <Divider />

        {/* ═══════════════════════════════════════════════════════════
            STEP 1 — Criar Torneio
        ═══════════════════════════════════════════════════════════ */}
        <SectionTitle
          id="torneio" num="1"
          title="Criar o Torneio"
          subtitle="O torneio e o container raiz. Todos os eventos, duplas e partidas pertencem a ele. Comece sempre por aqui."
        />

        <MockScreen title="painel.arenabeachtennis.com.br — Torneios">
          <MockNav active="Torneios" />
          <div style={{ padding: '1rem 0', display: 'grid', gridTemplateColumns: '310px 1fr', gap: '1rem' }}>
            {/* Form */}
            <MockCard>
              <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.875rem' }}>Novo Torneio</div>
              <MockInput label="Nome do torneio *" value="GWM Arena Open 2025" />
              <MockInput label="Estado *" value="Parana" />
              <MockInput label="Cidade *" value="Curitiba" />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                <MockInput label="Inicio" value="15/06/2025" />
                <MockInput label="Fim" value="17/06/2025" />
              </div>
              <div style={{ marginTop: '0.25rem' }}>
                <MockBtn label="+ Criar Torneio" primary />
              </div>
            </MockCard>

            {/* List */}
            <div>
              <div style={{
                fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-muted)',
                marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.08em',
              }}>Torneios Cadastrados</div>
              {[
                { name: 'GWM Arena Open 2025', cidade: 'Curitiba, PR', status: 'Rascunho',   cor: '#7A90B8', novo: true },
                { name: 'Copa Verao 2024',     cidade: 'Curitiba, PR', status: 'Finalizado', cor: '#22c55e', novo: false },
              ].map(t => (
                <MockCard key={t.name} style={{ marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      {t.name}
                      {t.novo && <MockBadge label="Novo" color="#3D9EFF" />}
                    </div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-faint)', marginTop: 2 }}>{t.cidade}</div>
                  </div>
                  <MockBadge label={t.status} color={t.cor} />
                  <MockBtn label="Gerenciar" small />
                </MockCard>
              ))}
            </div>
          </div>
        </MockScreen>

        <Step n={1} text='Acesse a aba "Torneios" no menu superior da plataforma.' />
        <Step n={2} text='No formulario a esquerda, preencha o nome do torneio (ex: "GWM Arena Open 2025"), selecione o estado — as cidades serao carregadas automaticamente — e informe as datas de inicio e fim.' />
        <Step n={3} text='Clique em "+ Criar Torneio". O torneio aparecera na lista a direita com status "Rascunho".' />
        <Step n={4} text='(Opcional) Clique em "Gerenciar" para editar os dados do torneio ou alterar seu status manualmente. O status muda automaticamente para "Live" assim que o primeiro chaveamento e gerado.' />

        <Result text='O torneio aparece na lista com status "Rascunho". Nenhuma acao do atletismo e disparada ainda.' />
        <Tip text='Um torneio pode ter multiplos eventos simultaneos (ex: Masculino A, Feminino B, Misto Open). Todos sao criados dentro do mesmo torneio.' />

        <Divider />

        {/* ═══════════════════════════════════════════════════════════
            STEP 2 — Criar Evento
        ═══════════════════════════════════════════════════════════ */}
        <SectionTitle
          id="evento" num="2"
          title="Criar Evento"
          subtitle="Um evento e uma categoria de disputa dentro do torneio: genero, formato e categoria. Crie um por modalidade."
        />

        <MockScreen title="painel.arenabeachtennis.com.br — Eventos">
          <MockNav active="Eventos" />
          <div style={{ padding: '1rem 0', display: 'grid', gridTemplateColumns: '310px 1fr', gap: '1rem' }}>
            <MockCard>
              <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.875rem' }}>Novo Evento</div>
              <MockInput label="Torneio *" value="GWM Arena Open 2025" />
              <MockInput label="Nome do evento *" value="Masculino Adulto A" />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                <MockInput label="Genero" value="Masculino" />
                <MockInput label="Categoria" value="A" />
              </div>
              <MockInput label="Formato" value="Grupos + Mata-mata" />
              <MockInput label="Max. duplas" value="16" />
              <div style={{ marginTop: '0.25rem' }}>
                <MockBtn label="+ Criar Evento" primary />
              </div>
            </MockCard>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <div style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>GWM Arena Open 2025</div>
                <MockBtn label="Selecionar todos" small />
              </div>
              {[
                { name: 'Masculino Adulto A', status: 'Rascunho', cor: '#7A90B8' },
                { name: 'Feminino Adulto A',  status: 'Rascunho', cor: '#7A90B8' },
                { name: 'Misto Open',         status: 'Rascunho', cor: '#7A90B8' },
              ].map(ev => (
                <MockCard key={ev.name} style={{ marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <input type="checkbox" readOnly style={{ width: 13, height: 13, accentColor: 'var(--accent-lime)' }} />
                  <div style={{ flex: 1 }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)', marginRight: 8 }}>{ev.name}</span>
                  </div>
                  <MockBadge label={ev.status} color={ev.cor} />
                  <MockBtn label="Excluir" danger small />
                </MockCard>
              ))}
              <div style={{ fontSize: '0.72rem', color: 'var(--text-faint)', marginTop: '0.5rem', paddingLeft: '0.25rem' }}>
                Marque checkboxes para excluir varios de uma vez.
              </div>
            </div>
          </div>
        </MockScreen>

        <Step n={1} text='Acesse a aba "Eventos" no menu superior.' />
        <Step n={2} text='Selecione o torneio ao qual o evento pertence.' />
        <Step n={3} text='Preencha o nome do evento (ex: "Masculino Adulto A"), o genero (Masculino / Feminino / Misto / Aberto), a categoria (A / B / C) e o formato de disputa.' />
        <Step n={4} text='O formato "Grupos + Mata-mata" e o mais comum: as duplas jogam entre si em grupos na fase inicial, e os classificados disputam semifinais e final. Tambem estao disponiveis os formatos Round Robin e Mata-mata puro.' />
        <Step n={5} text='Defina o numero maximo de duplas se quiser controlar as vagas. Deixe em branco para ilimitado.' />
        <Step n={6} text='Clique em "+ Criar Evento". Repita para cada categoria do torneio.' />

        <Result text='O evento aparece vinculado ao torneio com status "Rascunho". Voce pode criar quantos eventos quiser antes de lancar qualquer chaveamento.' />
        <Tip text='Para um torneio tipico de beach tennis: crie um evento por combinacao de genero e categoria. Exemplo: Masculino A, Masculino B, Feminino A, Misto Open.' />
        <Warn text='Para excluir varios eventos de uma vez, marque os checkboxes e clique em "Excluir N selecionados" — botao que aparece automaticamente quando ha selecao ativa.' />

        <Divider />

        {/* ═══════════════════════════════════════════════════════════
            STEP 3 — Cadastrar Jogadores
        ═══════════════════════════════════════════════════════════ */}
        <SectionTitle
          id="jogadores" num="3"
          title="Cadastrar Jogadores"
          subtitle="Registre todos os atletas que participarao do torneio. Os jogadores ficam em um registro global e podem ser reaproveitados em torneios futuros."
        />

        <MockScreen title="painel.arenabeachtennis.com.br — Jogadores">
          <MockNav active="Jogadores" />
          <div style={{ padding: '1rem 0', display: 'grid', gridTemplateColumns: '300px 1fr', gap: '1rem' }}>
            <MockCard>
              <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.875rem' }}>Novo Jogador</div>
              <MockInput label="Nome completo *" value="Carlos Eduardo Silva" />
              <MockInput label="Genero *" value="Masculino" />
              <MockInput label="E-mail" placeholder="carlos@email.com (opcional)" />
              <div style={{ marginTop: '0.25rem' }}>
                <MockBtn label="+ Adicionar Jogador" primary />
              </div>
            </MockCard>

            <div>
              <div style={{
                display: 'flex', gap: '0.5rem', marginBottom: '0.75rem',
              }}>
                <div style={{
                  flex: 1, background: 'var(--bg-surface)', border: '1px solid var(--border)',
                  borderRadius: 8, padding: '7px 12px', fontSize: '0.78rem', color: 'var(--text-faint)',
                }}>Buscar jogador...</div>
              </div>
              {[
                { name: 'Carlos Eduardo Silva', genero: 'Masculino',  initials: 'CS' },
                { name: 'Pedro Alves Costa',    genero: 'Masculino',  initials: 'PA' },
                { name: 'Thiago Mendes',        genero: 'Masculino',  initials: 'TM' },
                { name: 'Lucas Ferreira',       genero: 'Masculino',  initials: 'LF' },
                { name: 'Joao Rafael Lima',     genero: 'Masculino',  initials: 'JL' },
                { name: 'Marcos Neto',          genero: 'Masculino',  initials: 'MN' },
                { name: 'Bruno Costa',          genero: 'Masculino',  initials: 'BC' },
                { name: 'Felipe Andre',         genero: 'Masculino',  initials: 'FA' },
                { name: 'Andre Gustavo',        genero: 'Masculino',  initials: 'AG' },
                { name: 'Rafael Melo',          genero: 'Masculino',  initials: 'RM' },
              ].slice(0, 5).map((p, i) => (
                <MockCard key={p.name} style={{ marginBottom: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                  <div style={{
                    width: 30, height: 30, borderRadius: '50%',
                    background: 'rgba(61,158,255,0.18)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '0.7rem', fontWeight: 700, color: '#3D9EFF', flexShrink: 0,
                  }}>{p.initials}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)' }}>{p.name}</div>
                    <div style={{ fontSize: '0.68rem', color: 'var(--text-faint)' }}>{p.genero}</div>
                  </div>
                  <MockBtn label="Editar" small />
                </MockCard>
              ))}
              <div style={{ fontSize: '0.7rem', color: 'var(--text-faint)', paddingLeft: '0.25rem', marginTop: '0.25rem' }}>
                + 5 jogadores — total: 10 cadastrados
              </div>
            </div>
          </div>
        </MockScreen>

        <Step n={1} text='Acesse a aba "Jogadores" no menu superior.' />
        <Step n={2} text='Preencha o nome completo e o genero do atleta. O e-mail e opcional mas util para comunicacao futura.' />
        <Step n={3} text='Clique em "+ Adicionar Jogador". O jogador aparece imediatamente na lista a direita.' />
        <Step n={4} text='Repita para todos os atletas. Em nosso exemplo: 10 jogadores serao cadastrados para formar 5 duplas.' />
        <Step n={5} text='Use a barra de busca para localizar jogadores ja cadastrados. Clique em "Editar" para corrigir dados.' />

        <Result text='Os 10 jogadores aparecem no registro global com seus respectivos generos. Eles estao disponiveis para formacao de duplas em qualquer evento.' />
        <Warn text='Cadastre TODOS os jogadores antes de montar as duplas. Um jogador precisa existir no sistema para ser selecionado em uma dupla.' />
        <Tip text='Jogadores cadastrados sao reutilizaveis em torneios futuros — voce nao precisa re-cadastrar atletas que ja participaram de edicoes anteriores.' />

        <Divider />

        {/* ═══════════════════════════════════════════════════════════
            STEP 4 — Montar Duplas
        ═══════════════════════════════════════════════════════════ */}
        <SectionTitle
          id="duplas" num="4"
          title="Montar Duplas"
          subtitle="Combine dois jogadores para formar cada dupla inscrita. As duplas sao vinculadas a um evento especifico do torneio."
        />

        <MockScreen title="painel.arenabeachtennis.com.br — Duplas">
          <MockNav active="Duplas" />
          <div style={{ padding: '1rem 0', display: 'grid', gridTemplateColumns: '300px 1fr', gap: '1rem' }}>
            <MockCard>
              <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.875rem' }}>Nova Dupla</div>
              <MockInput label="Evento *" value="Masculino Adulto A" />
              <MockInput label="Jogador 1 *" value="Carlos Eduardo Silva" />
              <MockInput label="Jogador 2 *" value="Pedro Alves Costa" />
              <MockInput label="Seed (cabeca de chave)" placeholder="Ex: 1, 2, 3..." value="1" />
              <div style={{ marginTop: '0.25rem' }}>
                <MockBtn label="+ Criar Dupla" primary />
              </div>
            </MockCard>

            <div>
              <div style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Duplas — Masculino Adulto A (5/16)</div>
              {[
                ['#1', 'Carlos / Pedro',  'Aceita'],
                ['#2', 'Joao / Rafael',   'Aceita'],
                ['#3', 'Marcos / Bruno',  'Aceita'],
                ['#4', 'Thiago / Lucas',  'Aceita'],
                ['#5', 'Felipe / Andre',  'Aceita'],
              ].map(([seed, name, status]) => (
                <MockCard key={name} style={{ marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: 6,
                    background: 'rgba(180,255,61,0.1)', border: '1px solid rgba(180,255,61,0.2)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '0.68rem', fontWeight: 800, color: 'var(--accent-lime)', flexShrink: 0,
                  }}>{seed}</div>
                  <div style={{ flex: 1, fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)' }}>{name}</div>
                  <MockBadge label={status as string} color="#22c55e" />
                  <MockBtn label="Editar" small />
                </MockCard>
              ))}
            </div>
          </div>
        </MockScreen>

        <Step n={1} text='Acesse a aba "Duplas" no menu superior.' />
        <Step n={2} text='Selecione o evento ao qual a dupla pertence (ex: "Masculino Adulto A").' />
        <Step n={3} text='Selecione o Jogador 1 e o Jogador 2 nos respectivos campos. Ambos devem estar cadastrados previamente na aba Jogadores.' />
        <Step n={4} text='Informe o seed (cabeca de chave) se aplicavel. Seed #1 = dupla mais favorita. O seed e usado para distribuicao inteligente nos grupos, garantindo que os favoritos nao se encontrem cedo.' />
        <Step n={5} text='Clique em "+ Criar Dupla". O status e automaticamente definido como "Aceita" no painel admin (aprovacao automatica). Repita para todas as duplas inscritas — em nosso exemplo, 5 duplas.' />

        <Result text='As 5 duplas aparecem vinculadas ao evento "Masculino Adulto A" com status "Aceita". O sistema esta pronto para gerar o chaveamento.' />
        <Tip text='O seed define a ordem de "forca" das duplas. Na distribuicao snake-draft, o #1 vai para o Grupo A, #2 para o Grupo B, #3 de volta ao Grupo A, e assim por diante — garantindo equilibrio entre os grupos.' />
        <Warn text='Cada jogador so pode aparecer em uma dupla por evento. O sistema bloqueia a criacao de uma segunda dupla com o mesmo jogador dentro do mesmo evento.' />
        <Warn text='Sao necessarias no minimo 4 duplas para gerar um chaveamento valido. Com menos de 4, o botao de gerar chaveamento ficara bloqueado.' />

        <Divider />

        {/* ═══════════════════════════════════════════════════════════
            STEP 5 — Gerar Chaveamento
        ═══════════════════════════════════════════════════════════ */}
        <SectionTitle
          id="chaveamento" num="5"
          title="Gerar Chaveamento"
          subtitle="Com as duplas prontas, gere o bracket. O sistema distribui as duplas nos grupos respeitando os seeds e gera automaticamente todas as partidas da fase de grupos."
        />

        <MockScreen title="painel.arenabeachtennis.com.br — Chaveamento">
          <MockNav active="Chaveamento" />
          <div style={{ padding: '1rem 0' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: '1rem' }}>
              {/* Form */}
              <MockCard>
                <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.875rem' }}>Gerar Chaveamento</div>
                <MockInput label="Evento *" value="Masculino Adulto A" />

                {/* Mode toggle */}
                <div style={{ marginBottom: '0.65rem' }}>
                  <div style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Tipo</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.4rem' }}>
                    {[
                      { label: 'Automatico', icon: '⚡', active: true },
                      { label: 'Manual',     icon: '✋', active: false },
                    ].map(m => (
                      <div key={m.label} style={{
                        padding: '0.5rem', borderRadius: 8, textAlign: 'center',
                        border: `2px solid ${m.active ? 'var(--accent-lime)' : 'var(--border)'}`,
                        background: m.active ? 'rgba(180,255,61,0.1)' : 'var(--bg-surface)',
                        color: m.active ? 'var(--accent-lime)' : 'var(--text-faint)',
                        fontSize: '0.75rem', fontWeight: 700,
                      }}>
                        <div style={{ fontSize: '1rem', marginBottom: '0.2rem' }}>{m.icon}</div>
                        {m.label}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Group count */}
                <div style={{ marginBottom: '0.65rem' }}>
                  <div style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Numero de grupos</div>
                  <div style={{ display: 'flex', gap: '0.35rem' }}>
                    {['2', '3', '4', '6', '8'].map(n => (
                      <div key={n} style={{
                        flex: 1, padding: '6px 0', textAlign: 'center', borderRadius: 7,
                        border: `1px solid ${n === '2' ? 'var(--accent-lime)' : 'var(--border)'}`,
                        background: n === '2' ? 'var(--accent-lime)' : 'var(--bg-surface)',
                        color: n === '2' ? '#06091A' : 'var(--text-muted)',
                        fontSize: '0.78rem', fontWeight: 700,
                      }}>{n}</div>
                    ))}
                  </div>
                </div>

                {/* Summary */}
                <div style={{
                  background: 'rgba(180,255,61,0.05)', border: '1px solid rgba(180,255,61,0.15)',
                  borderRadius: 8, padding: '0.65rem', marginBottom: '0.75rem',
                  fontSize: '0.75rem', color: 'var(--text-muted)',
                }}>
                  <div style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.3rem' }}>Resumo</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.15rem' }}>
                    <span>Duplas inscritas</span><span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>5</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.15rem' }}>
                    <span>Grupos</span><span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>2</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Distribuicao</span><span style={{ fontWeight: 700, color: 'var(--accent-lime)' }}>A:3 duplas / B:2 duplas</span>
                  </div>
                </div>

                <MockBtn label="Gerar Chaveamento" primary />
              </MockCard>

              {/* Groups preview */}
              <div>
                <div style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Previa dos Grupos</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {[
                    { name: 'GRUPO A', duplas: ['#1 Carlos / Pedro', '#4 Thiago / Lucas', '#5 Felipe / Andre'] },
                    { name: 'GRUPO B', duplas: ['#2 Joao / Rafael', '#3 Marcos / Bruno'] },
                  ].map(g => (
                    <MockCard key={g.name} style={{ borderRadius: 8, overflow: 'hidden', padding: 0 }}>
                      <div style={{
                        padding: '0.4rem 0.75rem', borderBottom: '1px solid var(--border)',
                        fontSize: '0.68rem', fontWeight: 800, color: 'var(--accent-lime)',
                        letterSpacing: '0.1em', background: 'rgba(180,255,61,0.05)',
                      }}>{g.name}</div>
                      <div style={{ padding: '0.5rem 0.75rem' }}>
                        {g.duplas.map(d => (
                          <div key={d} style={{
                            fontSize: '0.77rem', color: 'var(--text-muted)',
                            padding: '0.3rem 0', borderBottom: '1px solid rgba(28,45,80,0.4)',
                          }}>{d}</div>
                        ))}
                      </div>
                    </MockCard>
                  ))}
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-faint)' }}>
                    Distribuicao snake-draft: A1→B2→A3→B4→A5
                  </div>
                </div>
              </div>
            </div>
          </div>
        </MockScreen>

        <Step n={1} text='Acesse a aba "Chaveamento" no menu superior.' />
        <Step n={2} text='Selecione o evento que deseja chavear.' />
        <Step n={3} text='Escolha o modo: "Automatico" (o sistema distribui as duplas respeitando os seeds) ou "Manual" (voce define quem joga em cada partida).' />
        <Step n={4} text='Selecione o numero de grupos: 2, 3, 4, 6 ou 8. Com 5 duplas e 2 grupos, o Grupo A recebe 3 duplas e o Grupo B recebe 2 — distribuicao via snake-draft.' />
        <Step n={5} text='Verifique o resumo (numero de duplas, grupos, distribuicao estimada) e clique em "Gerar Chaveamento".' />
        <Step n={6} text='O sistema cria todos os grupos, gera as partidas da fase de grupos e atualiza o status do evento para "Live".' />

        <Result text='Os grupos sao criados com as duplas distribuidas, todas as partidas da fase de grupos sao agendadas e o status do evento muda para "Live".' />
        <Tip text='Com 5 duplas e 2 grupos: Grupo A recebe as duplas #1, #4, #5 (seeds 1, 4 e 5 pela distribuicao snake-draft) e Grupo B recebe #2 e #3. Isso garante que os dois favoritos (#1 e #2) estejam em grupos diferentes.' />
        <Warn text='Gere o chaveamento somente apos todas as duplas estarem cadastradas. Se precisar refazer, use o botao "Excluir Chaveamento" — isso apaga TODAS as partidas e placares registrados ate o momento.' />
        <Tip text='Para chaveamento manual: o sistema cria a estrutura de grupos e partidas primeiro, e depois voce atribui as duplas a cada partida individualmente via selects.' />

        <Divider />

        {/* ═══════════════════════════════════════════════════════════
            STEP 6 — Lancar Placares (Fase de Grupos)
        ═══════════════════════════════════════════════════════════ */}
        <SectionTitle
          id="placares-grupo" num="6"
          title="Lancamentos: Fase de Grupos"
          subtitle="Apos cada partida jogada, registre o placar no sistema. A classificacao dos grupos e atualizada em tempo real apos cada lancamento."
        />

        <BracketGroupsMockup />

        <Step n={1} text='Na aba "Chaveamento", localize a partida na lista de partidas de cada grupo. Partidas concluidas exibem o placar; partidas pendentes exibem o link "Lancar Placar →".' />
        <Step n={2} text='Clique em "Lancar Placar →" para ir a pagina de lancamento da partida especifica (/matches/[id]/score).' />
        <Step n={3} text='Na pagina de lancamento, voce vera os nomes das duas duplas. Preencha os games de cada set (ex: Set 1 → 6 e 3, Set 2 → 6 e 4).' />
        <Step n={4} text='Se houver tiebreak, informe o placar do tiebreak no campo opcional abaixo dos games. Ex: Set 3 → 6x6, tiebreak → 10x7.' />
        <Step n={5} text='Clique em "+ Adicionar Set" se a partida for ate o terceiro set.' />
        <Step n={6} text='Selecione o time vencedor clicando no radio button ao lado do nome da dupla vencedora.' />
        <Step n={7} text='Clique em "Salvar Resultado". A classificacao do grupo e atualizada instantaneamente.' />

        <Result text='A partida e marcada como "Concluida". A tabela de classificacao do grupo e recalculada: o vencedor recebe 3 pontos (vitoria), o perdedor 0.' />
        <Tip text='Voce pode acessar a pagina de lancamento diretamente pelo link /matches/[id]/score, ideal para o arbitro usar em um celular ou tablet durante a partida.' />
        <Tip text='A pagina de lancamento exige login. Apenas organizadores autenticados podem registrar resultados.' />

        <ScoreEntryMockup />

        <Divider />

        {/* ═══════════════════════════════════════════════════════════
            STEP 7 — Motor de Automacao
        ═══════════════════════════════════════════════════════════ */}
        <SectionTitle
          id="automacao" num="7"
          title="Motor de Automacao"
          subtitle="Apos todas as partidas da fase de grupos serem concluidas, o sistema age automaticamente — nenhuma acao manual e necessaria do organizador."
        />

        <AutomationDiagramMockup />

        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', lineHeight: 1.65, margin: '1rem 0' }}>
          O motor de automacao e disparado automaticamente apos o lancamento da ultima partida de cada grupo.
          Voce nao precisa fazer nada — o sistema detecta que todos os jogos do grupo foram concluidos e executa
          a sequencia de acoes a seguir.
        </p>

        <div style={{
          background: 'var(--bg-card)', border: '1px solid var(--border)',
          borderRadius: 12, overflow: 'hidden', margin: '1rem 0',
        }}>
          {[
            { n: 1, titulo: 'Recalcula as classificacoes', desc: 'Pontos (V=3, D=0), saldo de games e desempate sao atualizados para todas as duplas do grupo.' },
            { n: 2, titulo: 'Determina os classificados', desc: 'Os primeiros e segundos colocados de cada grupo avancam para o mata-mata. Ex: com 2 grupos — A1, A2, B1, B2 avancam.' },
            { n: 3, titulo: 'Gera os confrontos do mata-mata', desc: 'Cruzamento de brackets: o primeiro de um grupo enfrenta o segundo do outro. A1 vs B2 (Semifinal 1) e B1 vs A2 (Semifinal 2).' },
            { n: 4, titulo: 'Agenda as partidas do mata-mata', desc: 'As partidas de Semifinal sao criadas automaticamente no sistema, ja com as duplas corretas atribuidas.' },
          ].map(item => (
            <div key={item.n} style={{
              padding: '0.875rem 1.25rem', borderBottom: '1px solid var(--border)',
              display: 'flex', gap: '1rem', alignItems: 'flex-start',
            }}>
              <div style={{
                width: 26, height: 26, borderRadius: '50%', flexShrink: 0,
                background: 'rgba(180,255,61,0.12)', border: '1px solid rgba(180,255,61,0.25)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: 'Barlow Condensed, sans-serif', fontSize: '0.78rem',
                fontWeight: 900, color: 'var(--accent-lime)',
              }}>{item.n}</div>
              <div>
                <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.2rem' }}>{item.titulo}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.55 }}>{item.desc}</div>
              </div>
            </div>
          ))}
        </div>

        <Result text='As partidas de Semifinal aparecem automaticamente na aba Chaveamento, prontas para lancamento de placar. O organizador so precisa esperar os jogos acontecerem.' />
        <Tip text='Com 5 duplas e 2 grupos (A: 3 duplas, B: 2 duplas): A1 enfrenta B2 na Semifinal 1, e B1 enfrenta A2 na Semifinal 2. O motor sempre faz o cruzamento entre grupos.' />

        <Divider />

        {/* ═══════════════════════════════════════════════════════════
            STEP 8 — Lancar Placares (Mata-mata)
        ═══════════════════════════════════════════════════════════ */}
        <SectionTitle
          id="placares-ko" num="8"
          title="Lancamentos: Mata-mata"
          subtitle="O fluxo de lancamento e identico ao da fase de grupos. As semifinais aparecem na aba Chaveamento assim que o motor de automacao as gera."
        />

        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', lineHeight: 1.65, margin: '0 0 1rem' }}>
          Apos as semifinais serem geradas automaticamente pelo motor, elas aparecem na aba "Chaveamento"
          com o link "Lancar Placar →". O processo e exatamente o mesmo da fase de grupos:
          clique no link, informe os games de cada set, selecione o vencedor e salve.
        </p>

        <div style={{
          background: 'var(--bg-card)', border: '1px solid var(--border)',
          borderRadius: 12, padding: '1.25rem', margin: '1rem 0',
        }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.75rem' }}>
            Sequencia do Mata-mata
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {[
              { fase: 'Semifinal 1', duplas: 'A1 vs B2', auto: false },
              { fase: 'Semifinal 2', duplas: 'B1 vs A2', auto: false },
              { fase: 'Final',       duplas: 'Vencedor SF1 vs Vencedor SF2', auto: true },
            ].map(item => (
              <div key={item.fase} style={{
                display: 'flex', alignItems: 'center', gap: '0.75rem',
                padding: '0.6rem 0.875rem', borderRadius: 8,
                background: item.auto ? 'rgba(180,255,61,0.05)' : 'rgba(255,255,255,0.02)',
                border: `1px solid ${item.auto ? 'rgba(180,255,61,0.15)' : 'var(--border)'}`,
              }}>
                <div style={{
                  fontSize: '0.7rem', fontWeight: 800, color: item.auto ? 'var(--accent-lime)' : 'var(--text-muted)',
                  minWidth: 90,
                }}>{item.fase}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-primary)', flex: 1 }}>{item.duplas}</div>
                {item.auto ? (
                  <MockBadge label="Gerada automaticamente" color="#B4FF3D" />
                ) : (
                  <MockBadge label="Lancamento manual" color="#7A90B8" />
                )}
              </div>
            ))}
          </div>
        </div>

        <Step n={1} text='Localize as partidas de Semifinal na aba "Chaveamento". Elas aparecem apos o motor de automacao ser disparado (ultima partida de grupo concluida).' />
        <Step n={2} text='Clique em "Lancar Placar →" na Semifinal 1. Informe os sets, selecione o vencedor e salve.' />
        <Step n={3} text='Repita para a Semifinal 2.' />
        <Step n={4} text='Apos AMBAS as semifinais concluidas, o motor dispara novamente e gera automaticamente a partida da Final com os dois vencedores.' />

        <Result text='A partida da Final aparece automaticamente no chaveamento com as duas duplas vencedoras das semifinais. Nenhuma acao adicional do organizador e necessaria.' />
        <Tip text='Voce pode lancar os placares das semifinais em qualquer ordem. O motor so gera a Final quando as DUAS semifinais estiverem concluidas.' />

        <Divider />

        {/* ═══════════════════════════════════════════════════════════
            STEP 9 — Final e Campeao
        ═══════════════════════════════════════════════════════════ */}
        <SectionTitle
          id="final" num="9"
          title="Final e Campeao"
          subtitle="Lance o placar da Final normalmente. O sistema identifica e declara o campeao automaticamente apos o resultado ser salvo."
        />

        <KnockoutBracketMockup />

        <Step n={1} text='Localize a partida da Final na aba "Chaveamento". Ela e gerada automaticamente apos as duas semifinais serem concluidas.' />
        <Step n={2} text='Clique em "Lancar Placar →" na Final. O fluxo e identico ao das demais partidas: sets, games, tiebreak (se houver) e selecao do vencedor.' />
        <Step n={3} text='Clique em "Salvar Resultado". O sistema processa o resultado e declara o campeao.' />
        <Step n={4} text='O evento e automaticamente atualizado para o status "Finalizado". O campeao aparece destacado no bracket com o icone de trofeu.' />
        <Step n={5} text='No painel admin, voce pode alterar manualmente o status do torneio para "Finalizado" assim que todos os eventos forem concluidos, fechando oficialmente o torneio.' />

        <Result text='O status do evento muda para "Finalizado". O campeao e vice-campeao ficam registrados no sistema e visiveis na pagina publica do torneio.' />
        <Tip text='Os resultados ficam permanentemente disponiveis no sistema, mesmo apos o encerramento do torneio. Voce pode consultar historico de qualquer edicao a qualquer momento.' />

        <MockScreen title="Final — Masculino Adulto A — GWM Arena Open 2025">
          <div style={{ padding: '1.25rem', textAlign: 'center' }}>
            <div style={{ fontSize: '0.7rem', fontWeight: 800, color: '#FFD14A', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
              Final — Masculino Adulto A
            </div>
            <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: '1.4rem', fontWeight: 900, color: 'var(--text-primary)', marginBottom: '1.5rem' }}>
              GWM Arena Open 2025
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 60px 1fr', gap: '1rem', alignItems: 'center', maxWidth: 480, margin: '0 auto' }}>
              {/* Campeao */}
              <MockCard style={{
                textAlign: 'center',
                background: 'rgba(255,209,74,0.08)', border: '1px solid rgba(255,209,74,0.35)',
                boxShadow: '0 0 24px rgba(255,209,74,0.12)',
              }}>
                <div style={{ fontSize: '1.75rem', marginBottom: '0.25rem' }}>🏆</div>
                <div style={{ fontSize: '0.65rem', fontWeight: 800, color: '#FFD14A', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Campeoes</div>
                <div style={{ fontSize: '0.875rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '0.25rem', lineHeight: 1.3 }}>Carlos / Pedro</div>
                <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: '1rem', fontWeight: 800, color: '#FFD14A', marginTop: '0.4rem' }}>7-5  6-3</div>
              </MockCard>

              <div style={{ textAlign: 'center', fontFamily: 'Barlow Condensed, sans-serif', fontSize: '1.1rem', fontWeight: 900, color: 'var(--text-faint)' }}>VS</div>

              {/* Vice */}
              <MockCard style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '1.75rem', marginBottom: '0.25rem' }}>🥈</div>
                <div style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Vice</div>
                <div style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '0.25rem', lineHeight: 1.3 }}>Joao / Rafael</div>
                <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: '1rem', fontWeight: 700, color: 'var(--text-muted)', marginTop: '0.4rem' }}>5-7  3-6</div>
              </MockCard>
            </div>

            <div style={{ marginTop: '1.5rem', display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
              <MockBtn label="Alterar status: Finalizado" primary />
              <MockBtn label="Compartilhar resultados" />
            </div>
          </div>
        </MockScreen>

        <Divider />

        {/* ═══════════════════════════════════════════════════════════
            STEP 10 — Acompanhamento ao Vivo
        ═══════════════════════════════════════════════════════════ */}
        <SectionTitle
          id="ao-vivo" num="10"
          title="Acompanhamento ao Vivo"
          subtitle="O sistema disponibiliza URLs publicas para atletas e espectadores acompanharem o torneio em tempo real, sem necessidade de login."
        />

        <PublicViewMockup />

        <Step n={1} text='A pagina publica do torneio esta disponivel em /torneios/[slug]. O slug e gerado automaticamente a partir do nome do torneio (ex: gwm-arena-open-2025).' />
        <Step n={2} text='Na pagina publica, a aba "Grupos" exibe a tabela de classificacao de cada grupo em tempo real, com vitórias, derrotas e pontos atualizados a cada lancamento.' />
        <Step n={3} text='A aba "Bracket" exibe o mata-mata visual — a medida que os resultados sao lancados, os vencedores avancam automaticamente no bracket.' />
        <Step n={4} text='A aba "Ao Vivo" exibe as partidas em andamento, resultados recentes e proximas partidas.' />
        <Step n={5} text='A aba "Ranking" exibe a classificacao geral com pontos acumulados de todos os eventos.' />
        <Step n={6} text='Para exibir um evento especifico em telao, use a URL /ao-vivo/[eventId] — exibe apenas o bracket e o placar daquele evento, sem menus ou navegacao.' />

        <Result text='Qualquer pessoa com o link pode acompanhar o torneio em tempo real. Nao e necessario criar conta ou fazer login.' />
        <Tip text='Compartilhe o link /torneios/[slug] no grupo de WhatsApp do torneio. Os atletas poderao acompanhar a classificacao dos grupos e o bracket diretamente pelo celular.' />
        <Tip text='O link /ao-vivo/[eventId] e ideal para projetar em um telao no local do torneio. A pagina atualiza automaticamente sem necessidade de recarregar.' />

        <Divider />

        {/* ═══════════════════════════════════════════════════════════
            Resumo rapido
        ═══════════════════════════════════════════════════════════ */}
        <div style={{
          background: 'var(--bg-card)', border: '1px solid var(--border)',
          borderRadius: 14, padding: '1.5rem', marginBottom: '3rem',
        }}>
          <h3 style={{
            fontFamily: 'Barlow Condensed, sans-serif', fontSize: '1.4rem',
            fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 1.25rem',
          }}>Resumo Rapido — Checklist do Organizador</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            {[
              ['1', 'Criar torneio',         'Aba Torneios → preencher nome, cidade e datas → Criar Torneio'],
              ['2', 'Criar eventos',          'Aba Eventos → selecionar torneio → definir genero, formato e categoria'],
              ['3', 'Cadastrar jogadores',    'Aba Jogadores → nome completo + genero (obrigatorio) para cada atleta'],
              ['4', 'Montar duplas',          'Aba Duplas → selecionar evento → 2 jogadores + seed opcional → Criar Dupla'],
              ['5', 'Gerar chaveamento',      'Aba Chaveamento → selecionar evento → modo (auto/manual) → N grupos → Gerar'],
              ['6', 'Lancar placares grupos', 'Chaveamento → Lancar Placar → sets + vencedor → Salvar Resultado'],
              ['7', 'Motor automatico',       '(Automatico) — sistema gera semifinals apos todos os jogos do grupo'],
              ['8', 'Lancar placares semis',  'Mesmo fluxo do passo 6, para as partidas de Semifinal'],
              ['9', 'Final',                  '(Automatico) — final gerada apos ambas as semifinais → lancar placar → salvar'],
              ['10','Acompanhamento',         '/torneios/[slug] (publico) · /ao-vivo/[eventId] (telao, sem login)'],
            ].map(([num, titulo, desc]) => (
              <div key={num} style={{
                display: 'flex', gap: '0.75rem', alignItems: 'flex-start',
                padding: '0.625rem 0.75rem', borderRadius: 8,
                background: 'var(--bg-surface)', border: '1px solid rgba(28,45,80,0.6)',
              }}>
                <div style={{
                  width: 22, height: 22, borderRadius: 5, flexShrink: 0,
                  background: 'rgba(180,255,61,0.12)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '0.62rem', fontWeight: 900, color: 'var(--accent-lime)',
                }}>{num}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.15rem' }}>{titulo}</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', lineHeight: 1.45 }}>{desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════
            Dicas gerais e limites
        ═══════════════════════════════════════════════════════════ */}
        <div style={{
          background: 'var(--bg-card)', border: '1px solid var(--border)',
          borderRadius: 14, padding: '1.5rem', marginBottom: '3rem',
        }}>
          <h3 style={{
            fontFamily: 'Barlow Condensed, sans-serif', fontSize: '1.4rem',
            fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 1rem',
          }}>Limites e Comportamentos do Sistema</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            {[
              {
                titulo: 'Minimo de duplas',
                desc: 'Sao necessarias no minimo 4 duplas para gerar um chaveamento. Com menos, o botao fica desabilitado.',
                tipo: 'warn',
              },
              {
                titulo: 'Composicao de duplas',
                desc: 'Cada dupla precisa ter exatamente 2 jogadores. Um jogador nao pode estar em duas duplas no mesmo evento.',
                tipo: 'warn',
              },
              {
                titulo: 'Excluir chaveamento',
                desc: 'O botao "Excluir Chaveamento" apaga todos os grupos, partidas e placares. Use com cuidado — a acao e irreversivel.',
                tipo: 'danger',
              },
              {
                titulo: 'Regenerar chaveamento',
                desc: 'Apos excluir o chaveamento, voce pode gerar um novo com configuracoes diferentes (mais ou menos grupos, outro modo).',
                tipo: 'info',
              },
              {
                titulo: 'View publica sem login',
                desc: 'As URLs /torneios/[slug] e /ao-vivo/[eventId] sao totalmente publicas. Nenhum cadastro e necessario.',
                tipo: 'info',
              },
              {
                titulo: 'Distribuicao snake-draft',
                desc: 'Com 5 duplas e 2 grupos: Grupo A recebe duplas #1, #4, #5 (3 duplas) e Grupo B recebe #2, #3 (2 duplas). Automatico.',
                tipo: 'info',
              },
            ].map(item => (
              <div key={item.titulo} style={{
                background: item.tipo === 'danger'
                  ? 'rgba(255,64,96,0.05)'
                  : item.tipo === 'warn'
                  ? 'rgba(255,180,0,0.05)'
                  : 'rgba(61,158,255,0.05)',
                border: `1px solid ${item.tipo === 'danger'
                  ? 'rgba(255,64,96,0.2)'
                  : item.tipo === 'warn'
                  ? 'rgba(255,180,0,0.18)'
                  : 'rgba(61,158,255,0.18)'}`,
                borderRadius: 10, padding: '0.875rem',
              }}>
                <div style={{
                  fontSize: '0.78rem', fontWeight: 700,
                  color: item.tipo === 'danger' ? '#FF6080'
                       : item.tipo === 'warn' ? '#FFB800'
                       : '#3D9EFF',
                  marginBottom: '0.3rem',
                }}>{item.titulo}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>{item.desc}</div>
              </div>
            ))}
          </div>
        </div>

        <p style={{ textAlign: 'center', color: 'var(--text-faint)', fontSize: '0.78rem', paddingBottom: '1rem' }}>
          Arena Beach Tennis · Manual do Sistema v2.0 · Atualizado em Maio 2025
        </p>
      </main>
    </div>
  );
}
