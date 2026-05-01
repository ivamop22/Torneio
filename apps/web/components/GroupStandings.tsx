'use client';

type Team = { id: string; label: string };

type Standing = {
  id: string;
  teamId: string;
  team: Team | null;
  rankPosition: number | null;
  played: number;
  wins: number;
  losses: number;
  setsFor: number;
  setsAgainst: number;
  gamesFor: number;
  gamesAgainst: number;
  points: number;
};

type MatchItem = {
  id: string;
  matchNumber: number;
  status: string;
  team1: Team | null;
  team2: Team | null;
  winner: Team | null;
  sets: Array<{ setNumber: number; team1Games: number; team2Games: number }>;
};

type Group = {
  id: string;
  name: string;
  position: number;
  standings: Standing[];
  matches: MatchItem[];
};

type Props = {
  groups: Group[];
  apiUrl: string;
  onRefresh: () => void;
};

const RANK_STYLES: Record<number, { bg: string; color: string; border: string }> = {
  1: { bg: 'rgba(255,209,74,0.15)', color: '#FFD14A', border: 'rgba(255,209,74,0.35)' },
  2: { bg: 'rgba(180,180,200,0.1)', color: '#B0B8CC', border: 'rgba(180,180,200,0.25)' },
  3: { bg: 'rgba(180,120,60,0.15)', color: '#C8863A', border: 'rgba(180,120,60,0.3)' },
};

function RankBadge({ pos }: { pos: number }) {
  const s = RANK_STYLES[pos];
  return (
    <div style={{
      width: '1.75rem', height: '1.75rem',
      borderRadius: '50%',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: '0.75rem', fontWeight: 800,
      fontFamily: 'Barlow Condensed, sans-serif',
      background: s?.bg ?? 'var(--bg-elevated)',
      color: s?.color ?? 'var(--text-faint)',
      border: `1px solid ${s?.border ?? 'var(--border)'}`,
      flexShrink: 0,
    }}>
      {pos}
    </div>
  );
}

const GROUP_COLORS = [
  '#B4FF3D', '#3D9EFF', '#FFD14A', '#A875FF',
  '#FF7A3D', '#00DCBF', '#FF4060', '#60D870',
];

export function GroupStandings({ groups, apiUrl, onRefresh }: Props) {
  if (groups.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '3rem 2rem', color: 'var(--text-muted)' }}>
        <p>Nenhum grupo encontrado. Gere o chaveamento primeiro.</p>
      </div>
    );
  }

  async function submitResult(matchId: string, winnerTeamId: string, loserTeamId: string) {
    await fetch(`${apiUrl}/matches/${matchId}/result`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ winnerTeamId, loserTeamId }),
    });
    onRefresh();
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '1.25rem' }}>
      {groups.map((group, gi) => {
        const accentColor = GROUP_COLORS[gi % GROUP_COLORS.length];
        const letter = group.name.replace(/grupo\s*/i, '').trim() || String(gi + 1);

        return (
          <div key={group.id} style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-lg)',
            overflow: 'hidden',
          }}>
            {/* Group header */}
            <div style={{
              padding: '0.875rem 1.25rem',
              background: 'var(--bg-surface)',
              borderBottom: '1px solid var(--border)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
            }}>
              <div style={{
                width: '2rem', height: '2rem',
                borderRadius: '8px',
                background: `${accentColor}20`,
                border: `1px solid ${accentColor}40`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: 'Barlow Condensed, sans-serif',
                fontWeight: 800, fontSize: '1rem',
                color: accentColor,
                flexShrink: 0,
              }}>
                {letter}
              </div>
              <h3 style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                {group.name}
              </h3>
              <span style={{ marginLeft: 'auto', fontSize: '0.7rem', color: 'var(--text-faint)' }}>
                {group.standings.length} duplas
              </span>
            </div>

            {/* Standings table */}
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)' }}>
                    {['#', 'Dupla', 'J', 'V', 'D', 'Sets', 'Pts'].map((h, i) => (
                      <th key={h} style={{
                        padding: '0.5rem 0.625rem',
                        textAlign: i === 1 ? 'left' : 'center',
                        fontSize: '0.65rem', fontWeight: 700,
                        textTransform: 'uppercase', letterSpacing: '0.08em',
                        color: 'var(--text-faint)',
                      }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {group.standings.map((s, idx) => {
                    const isClassified = idx < 2;
                    const pos = s.rankPosition ?? idx + 1;
                    return (
                      <tr key={s.id} style={{
                        borderBottom: '1px solid rgba(28,45,80,0.5)',
                        opacity: isClassified ? 1 : 0.7,
                      }}>
                        <td style={{ padding: '0.625rem 0.625rem', textAlign: 'center' }}>
                          <RankBadge pos={pos} />
                        </td>
                        <td style={{ padding: '0.625rem 0.5rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            {isClassified && (
                              <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#00C850', flexShrink: 0 }} title="Classificado" />
                            )}
                            <span style={{
                              fontWeight: 600,
                              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                              maxWidth: '140px',
                              color: isClassified ? 'var(--text-primary)' : 'var(--text-muted)',
                            }}>
                              {s.team?.label ?? 'Desconhecido'}
                            </span>
                          </div>
                        </td>
                        {[s.played, s.wins, s.losses].map((v, i) => (
                          <td key={i} style={{ padding: '0.625rem 0.5rem', textAlign: 'center', color: i === 1 ? '#00C850' : i === 2 ? 'var(--accent-red)' : 'var(--text-muted)' }}>
                            {v}
                          </td>
                        ))}
                        <td style={{ padding: '0.625rem 0.5rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                          {s.setsFor}/{s.setsAgainst}
                        </td>
                        <td style={{ padding: '0.625rem 0.625rem', textAlign: 'center' }}>
                          <span style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: '1rem', fontWeight: 800, color: isClassified ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                            {s.points}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Legend */}
            <div style={{
              padding: '0.5rem 1rem',
              background: 'rgba(0,0,0,0.2)',
              borderTop: '1px solid var(--border)',
              display: 'flex', alignItems: 'center', gap: '0.5rem',
              fontSize: '0.7rem', color: 'var(--text-faint)',
            }}>
              <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#00C850', flexShrink: 0 }} />
              Top 2 avançam para o mata-mata
            </div>

            {/* Matches */}
            {group.matches.length > 0 && (
              <div style={{ borderTop: '1px solid var(--border)' }}>
                <div style={{ padding: '0.625rem 1rem 0.375rem', fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-faint)' }}>
                  Partidas
                </div>
                <div style={{ padding: '0 0.75rem 0.75rem', display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                  {group.matches.map(match => {
                    const isCompleted = match.status === 'completed';
                    return (
                      <div key={match.id} style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        padding: '0.5rem 0.75rem',
                        borderRadius: 'var(--radius-sm)',
                        background: isCompleted ? 'rgba(0,0,0,0.15)' : 'var(--bg-surface)',
                        border: '1px solid var(--border)',
                        fontSize: '0.78rem',
                      }}>
                        <span style={{ color: 'var(--text-faint)', fontSize: '0.7rem', width: '1.5rem', flexShrink: 0 }}>
                          #{match.matchNumber}
                        </span>

                        <span style={{
                          flex: 1, textAlign: 'right', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                          fontWeight: 600,
                          color: isCompleted && match.winner?.id === match.team1?.id ? '#00C850' : 'var(--text-primary)',
                        }}>
                          {match.team1?.label ?? '?'}
                        </span>

                        <div style={{ flexShrink: 0, textAlign: 'center' }}>
                          {isCompleted && match.sets.length > 0 ? (
                            <div style={{ display: 'flex', gap: '0.2rem' }}>
                              {match.sets.map(s => (
                                <span key={s.setNumber} style={{
                                  fontFamily: 'Barlow Condensed, sans-serif',
                                  fontSize: '0.75rem', fontWeight: 700,
                                  background: 'var(--bg-elevated)',
                                  padding: '0.1rem 0.3rem',
                                  borderRadius: '3px',
                                }}>
                                  {s.team1Games}-{s.team2Games}
                                </span>
                              ))}
                            </div>
                          ) : isCompleted ? (
                            <span style={{ color: '#00C850', fontSize: '0.75rem' }}>✓</span>
                          ) : (
                            <span style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--text-faint)' }}>VS</span>
                          )}
                        </div>

                        <span style={{
                          flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                          fontWeight: 600,
                          color: isCompleted && match.winner?.id === match.team2?.id ? '#00C850' : 'var(--text-primary)',
                        }}>
                          {match.team2?.label ?? '?'}
                        </span>

                        {!isCompleted && match.team1 && match.team2 && (
                          <div style={{ display: 'flex', gap: '0.3rem', flexShrink: 0 }}>
                            <button
                              onClick={() => submitResult(match.id, match.team1!.id, match.team2!.id)}
                              style={{ fontSize: '0.65rem', fontWeight: 700, padding: '0.2rem 0.45rem', borderRadius: '4px', background: 'rgba(0,200,80,0.12)', border: '1px solid rgba(0,200,80,0.25)', color: '#00C850', cursor: 'pointer' }}
                            >
                              1 ✓
                            </button>
                            <button
                              onClick={() => submitResult(match.id, match.team2!.id, match.team1!.id)}
                              style={{ fontSize: '0.65rem', fontWeight: 700, padding: '0.2rem 0.45rem', borderRadius: '4px', background: 'rgba(61,158,255,0.12)', border: '1px solid rgba(61,158,255,0.25)', color: '#5DB0FF', cursor: 'pointer' }}
                            >
                              2 ✓
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
