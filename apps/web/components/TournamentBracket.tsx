'use client';

type Team = {
  id: string;
  label: string;
  player1?: { fullName: string } | null;
  player2?: { fullName: string } | null;
};

type MatchSet = {
  setNumber: number;
  team1Games: number;
  team2Games: number;
  tieBreakTeam1?: number | null;
  tieBreakTeam2?: number | null;
};

type Match = {
  id: string;
  roundName: string;
  matchNumber: number;
  status: string;
  team1: Team | null;
  team2: Team | null;
  winner: Team | null;
  sets: MatchSet[];
};

type Props = {
  knockout: Record<string, Match[]>;
  roundOrder: string[];
  champion: Team | null;
  apiUrl: string;
  onRefresh: () => void;
};

function SetScore({ sets }: { sets: MatchSet[] }) {
  if (!sets.length) return null;
  return (
    <div style={{ display: 'flex', gap: '0.25rem', marginTop: '0.375rem' }}>
      {sets.map(s => (
        <span key={s.setNumber} style={{
          fontFamily: 'Barlow Condensed, sans-serif',
          fontSize: '0.8rem', fontWeight: 700,
          background: 'var(--bg-elevated)',
          border: '1px solid var(--border)',
          padding: '0.1rem 0.375rem',
          borderRadius: '4px',
          color: 'var(--text-primary)',
          letterSpacing: '0.02em',
        }}>
          {s.team1Games}-{s.team2Games}
          {s.tieBreakTeam1 != null ? `(${s.tieBreakTeam1})` : ''}
        </span>
      ))}
    </div>
  );
}

function MatchCard({ match, apiUrl, onRefresh }: { match: Match; apiUrl: string; onRefresh: () => void }) {
  const isCompleted = match.status === 'completed';
  const isLive      = match.status === 'live';

  async function submitResult(winnerTeamId: string, loserTeamId: string) {
    await fetch(`${apiUrl}/matches/${match.id}/result`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ winnerTeamId, loserTeamId }),
    });
    onRefresh();
  }

  function TeamRow({ team, isWinner, slot }: { team: Team | null; isWinner: boolean; slot: 1 | 2 }) {
    const opponent = slot === 1 ? match.team2 : match.team1;
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        padding: '0.5rem 0.75rem',
        borderRadius: '6px',
        background: isCompleted && isWinner ? 'rgba(0,200,80,0.08)' : 'var(--bg-elevated)',
        border: `1px solid ${isCompleted && isWinner ? 'rgba(0,200,80,0.2)' : 'transparent'}`,
        opacity: isCompleted && !isWinner ? 0.55 : 1,
      }}>
        {isCompleted && isWinner && (
          <span style={{ color: '#00C850', fontSize: '0.7rem', flexShrink: 0 }}>✓</span>
        )}
        <span style={{
          flex: 1,
          fontSize: '0.8rem',
          fontWeight: 600,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          color: !team ? 'var(--text-faint)' : isCompleted && isWinner ? '#00C850' : 'var(--text-primary)',
          fontStyle: !team ? 'italic' : 'normal',
        }}>
          {team?.label ?? 'A definir'}
        </span>
        {!isCompleted && match.team1 && match.team2 && team && opponent && (
          <button
            onClick={() => submitResult(team.id, opponent.id)}
            style={{
              flexShrink: 0,
              fontSize: '0.65rem',
              fontWeight: 700,
              padding: '0.2rem 0.45rem',
              borderRadius: '4px',
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-glow)',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              transition: 'var(--transition)',
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLElement).style.background = 'rgba(180,255,61,0.15)';
              (e.currentTarget as HTMLElement).style.color = 'var(--accent-lime)';
              (e.currentTarget as HTMLElement).style.borderColor = 'rgba(180,255,61,0.4)';
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLElement).style.background = 'var(--bg-surface)';
              (e.currentTarget as HTMLElement).style.color = 'var(--text-muted)';
              (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-glow)';
            }}
          >
            Venceu
          </button>
        )}
      </div>
    );
  }

  return (
    <div style={{
      background: 'var(--bg-card)',
      border: `1px solid ${isLive ? 'rgba(255,64,96,0.5)' : 'var(--border)'}`,
      borderRadius: 'var(--radius-md)',
      overflow: 'hidden',
      minWidth: '200px',
      maxWidth: '250px',
      boxShadow: isLive ? '0 0 20px rgba(255,64,96,0.12)' : 'none',
      transition: 'var(--transition)',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0.375rem 0.75rem',
        background: 'var(--bg-surface)',
        borderBottom: '1px solid var(--border)',
      }}>
        <span style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-faint)' }}>
          #{match.matchNumber}
        </span>
        <span style={{
          fontSize: '0.65rem', fontWeight: 700,
          padding: '0.1rem 0.4rem',
          borderRadius: '99px',
          background: isLive ? 'rgba(255,64,96,0.15)' : isCompleted ? 'rgba(0,200,80,0.1)' : 'var(--bg-elevated)',
          color: isLive ? '#FF6080' : isCompleted ? '#00C850' : 'var(--text-faint)',
          textTransform: 'uppercase' as const,
          letterSpacing: '0.06em',
          display: 'flex',
          alignItems: 'center',
          gap: '3px',
        }}>
          {isLive && <span className="live-dot" style={{ display: 'inline-block', width: '5px', height: '5px', borderRadius: '50%', background: 'var(--accent-red)' }} />}
          {isLive ? 'Ao Vivo' : isCompleted ? 'Encerrado' : 'Aguardando'}
        </span>
      </div>

      {/* Teams */}
      <div style={{ padding: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
        <TeamRow team={match.team1} isWinner={match.winner?.id === match.team1?.id} slot={1} />
        <div style={{ textAlign: 'center', fontSize: '0.6rem', fontWeight: 800, color: 'var(--text-faint)', letterSpacing: '0.1em' }}>VS</div>
        <TeamRow team={match.team2} isWinner={match.winner?.id === match.team2?.id} slot={2} />
      </div>

      {/* Sets */}
      {match.sets.length > 0 && (
        <div style={{ padding: '0 0.75rem 0.5rem' }}>
          <SetScore sets={match.sets} />
        </div>
      )}
    </div>
  );
}

export function TournamentBracket({ knockout, roundOrder, champion, apiUrl, onRefresh }: Props) {
  if (roundOrder.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem 2rem', color: 'var(--text-muted)' }}>
        <div style={{ fontSize: '3rem', marginBottom: '0.75rem', opacity: 0.4 }}>🎾</div>
        <p style={{ fontSize: '1.1rem', fontWeight: 600, fontFamily: 'Barlow Condensed, sans-serif' }}>Fase de grupos em andamento</p>
        <p style={{ fontSize: '0.875rem', marginTop: '0.5rem', color: 'var(--text-faint)' }}>
          O mata-mata será gerado automaticamente quando a fase de grupos terminar.
        </p>
      </div>
    );
  }

  const orderedRounds = [...roundOrder].reverse();

  const ROUND_STYLES: Record<string, { bg: string; text: string; border: string }> = {
    'Final':     { bg: 'rgba(255,209,74,0.1)',  text: '#FFD14A', border: 'rgba(255,209,74,0.3)' },
    'Semifinal': { bg: 'rgba(168,117,255,0.1)', text: '#A875FF', border: 'rgba(168,117,255,0.3)' },
  };

  return (
    <div style={{ width: '100%' }}>
      {/* Champion */}
      {champion && (
        <div style={{ marginBottom: '2.5rem', textAlign: 'center' }}>
          <div
            className="champion-glow"
            style={{
              display: 'inline-block',
              background: 'linear-gradient(135deg, rgba(255,209,74,0.15) 0%, rgba(255,160,30,0.08) 100%)',
              border: '2px solid rgba(255,209,74,0.5)',
              borderRadius: 'var(--radius-xl)',
              padding: '1.5rem 2.5rem',
            }}
          >
            <div className="trophy-bounce" style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>🏆</div>
            <div style={{ fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#FFD14A', marginBottom: '0.375rem' }}>
              Campeão
            </div>
            <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              {champion.label}
            </div>
          </div>
        </div>
      )}

      {/* Bracket */}
      <div style={{ overflowX: 'auto', paddingBottom: '1rem' }}>
        <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'flex-start', minWidth: 'max-content', padding: '0.5rem 1rem' }}>
          {orderedRounds.map(roundName => {
            const matches = knockout[roundName] ?? [];
            const style = ROUND_STYLES[roundName];
            return (
              <div key={roundName} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                {/* Round label */}
                <div style={{
                  textAlign: 'center',
                  marginBottom: '1rem',
                  padding: '0.3rem 1rem',
                  borderRadius: '99px',
                  fontSize: '0.75rem', fontWeight: 800,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  background: style?.bg ?? 'rgba(28,45,80,0.6)',
                  color: style?.text ?? 'var(--text-muted)',
                  border: `1px solid ${style?.border ?? 'var(--border)'}`,
                }}>
                  {roundName}
                </div>

                {/* Matches */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  {matches.map(m => (
                    <MatchCard key={m.id} match={m} apiUrl={apiUrl} onRefresh={onRefresh} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
