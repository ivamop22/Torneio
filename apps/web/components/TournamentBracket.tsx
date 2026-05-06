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
    <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.5rem', justifyContent: 'center' }}>
      {sets.map(s => (
        <span key={s.setNumber} style={{
          fontFamily: 'Barlow Condensed, sans-serif',
          fontSize: '1rem', // Maior para leitura no sol
          fontWeight: 800,
          background: 'var(--bg-surface, #1e293b)',
          border: '1px solid var(--border, #334155)',
          padding: '0.2rem 0.6rem',
          borderRadius: '6px',
          color: 'var(--text-primary, #f8fafc)',
          letterSpacing: '0.05em',
        }}>
          {s.team1Games} - {s.team2Games}
          {s.tieBreakTeam1 != null ? <span style={{ fontSize: '0.75rem', color: '#fbbf24', marginLeft: '2px' }}>({s.tieBreakTeam1})</span> : ''}
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

  const bothTeamsPresent = Boolean(match.team1 && match.team2);

  function TeamRow({ team, isWinner, slot }: { team: Team | null; isWinner: boolean; slot: 1 | 2 }) {
    const opponent = slot === 1 ? match.team2 : match.team1;
    const isPlaceholder = !team;

    if (isPlaceholder) {
      return (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          padding: '0.8rem 1rem', // Fat finger approach
          borderRadius: '8px',
          background: 'var(--bg-surface, #0f172a)',
          border: '2px dashed var(--border, #334155)', // Tracejado de alto contraste
        }}>
          <span style={{
            flex: 1,
            fontSize: '0.85rem',
            fontWeight: 600,
            color: 'var(--text-muted, #64748b)',
            textAlign: 'center',
          }}>
            Aguardando adversário
          </span>
        </div>
      );
    }

    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '0.5rem',
        padding: '0.6rem 0.8rem',
        borderRadius: '8px',
        background: isCompleted && isWinner ? 'rgba(34, 197, 94, 0.15)' : 'var(--bg-elevated, #1e293b)',
        border: `2px solid ${isCompleted && isWinner ? '#22c55e' : 'var(--border, #334155)'}`, // Borda mais grossa
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', overflow: 'hidden' }}>
          {isCompleted && isWinner && (
            <span style={{ color: '#22c55e', fontSize: '1rem', flexShrink: 0, fontWeight: 'bold' }}>✓</span>
          )}
          <span style={{
            fontSize: '0.9rem', // Maior legibilidade
            fontWeight: 700,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            color: isCompleted && isWinner ? '#22c55e' : (isCompleted && !isWinner ? 'var(--text-muted, #64748b)' : 'var(--text-primary, #f8fafc)'),
            textDecoration: isCompleted && !isWinner ? 'line-through' : 'none', // Feedback visual claro para quem perdeu
          }}>
            {team.label}
          </span>
        </div>

        {!isCompleted && bothTeamsPresent && opponent && (
          <button
            onClick={() => submitResult(team.id, opponent.id)}
            style={{
              flexShrink: 0,
              fontSize: '0.75rem',
              fontWeight: 800,
              padding: '0.5rem 0.8rem', // Fat finger button
              borderRadius: '6px',
              background: '#3b82f6', // Cor de ação chamativa
              border: 'none',
              color: '#ffffff',
              cursor: 'pointer',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
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
      background: 'var(--bg-card, #0f172a)',
      border: `2px solid ${isLive ? '#ef4444' : 'var(--border, #334155)'}`,
      borderRadius: '12px', // Cantos mais arredondados, visual mais moderno
      overflow: 'hidden',
      minWidth: '280px', // Mais largo para ocupar melhor a tela do celular
      maxWidth: '320px',
      boxShadow: isLive ? '0 0 15px rgba(239, 68, 68, 0.4)' : '0 4px 6px rgba(0,0,0,0.1)',
      display: 'flex',
      flexDirection: 'column',
    }}>
      {/* Header do Card */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0.5rem 1rem',
        background: isLive ? 'rgba(239, 68, 68, 0.1)' : 'var(--bg-surface, #1e293b)',
        borderBottom: '1px solid var(--border, #334155)',
      }}>
        <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted, #94a3b8)' }}>
          JOGO #{match.matchNumber}
        </span>
        <span style={{
          fontSize: '0.7rem', 
          fontWeight: 800,
          padding: '0.2rem 0.6rem',
          borderRadius: '99px',
          background: isLive ? '#ef4444' : isCompleted ? 'rgba(34, 197, 94, 0.2)' : 'var(--bg-elevated, #334155)',
          color: isLive ? '#ffffff' : isCompleted ? '#22c55e' : 'var(--text-muted, #94a3b8)',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
        }}>
          {isLive && <span style={{ display: 'inline-block', width: '6px', height: '6px', borderRadius: '50%', background: '#ffffff', animation: 'pulse 1.5s infinite' }} />}
          {isLive ? 'AO VIVO' : isCompleted ? 'FIM' : 'AGUARDANDO'}
        </span>
      </div>

      {/* Áreas dos Times */}
      <div style={{ padding: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
        <TeamRow team={match.team1} isWinner={match.winner?.id === match.team1?.id} slot={1} />
        <div style={{ textAlign: 'center', fontSize: '0.75rem', fontWeight: 900, color: 'var(--text-muted, #64748b)' }}>VS</div>
        <TeamRow team={match.team2} isWinner={match.winner?.id === match.team2?.id} slot={2} />
      </div>

      {/* Placar dos Sets */}
      {match.sets.length > 0 && (
        <div style={{ padding: '0 0.75rem 0.75rem', background: 'var(--bg-card, #0f172a)' }}>
          <SetScore sets={match.sets} />
        </div>
      )}
    </div>
  );
}

export function TournamentBracket({ knockout, roundOrder, champion, apiUrl, onRefresh }: Props) {
  if (roundOrder.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem 1.5rem', color: 'var(--text-muted, #94a3b8)' }}>
        <div style={{ fontSize: '4rem', marginBottom: '1rem', opacity: 0.8 }}>🎾</div>
        <h3 style={{ fontSize: '1.5rem', fontWeight: 800, fontFamily: 'Barlow Condensed, sans-serif', color: 'var(--text-primary, #f8fafc)' }}>
          FASE DE GRUPOS EM ANDAMENTO
        </h3>
        <p style={{ fontSize: '1rem', marginTop: '0.5rem' }}>
          As chaves do mata-mata serão geradas assim que os grupos finalizarem.
        </p>
      </div>
    );
  }

  const orderedRounds = [...roundOrder].reverse();

  const ROUND_STYLES: Record<string, { bg: string; text: string; border: string }> = {
    'Final':     { bg: 'rgba(251, 191, 36, 0.15)',  text: '#fbbf24', border: '#fbbf24' },
    'Semifinal': { bg: 'rgba(168, 85, 247, 0.15)', text: '#a855f7', border: '#a855f7' },
  };

  return (
    <div style={{ width: '100%' }}>
      {/* Container de rolagem responsivo com Snap Effect */}
      <div style={{ 
        overflowX: 'auto', 
        paddingBottom: '2rem',
        scrollSnapType: 'x mandatory', // Faz a rolagem "grudar" na próxima rodada no celular
        WebkitOverflowScrolling: 'touch',
      }}>
        
        {champion && (
          <div style={{ marginBottom: '3rem', textAlign: 'center', padding: '0 1rem' }}>
            <div style={{
              display: 'inline-block',
              background: 'linear-gradient(135deg, rgba(251, 191, 36, 0.2) 0%, rgba(245, 158, 11, 0.1) 100%)',
              border: '2px solid #fbbf24',
              borderRadius: '16px',
              padding: '2rem 3rem',
              boxShadow: '0 10px 25px rgba(251, 191, 36, 0.2)',
            }}>
              <div style={{ fontSize: '3.5rem', marginBottom: '0.5rem' }}>🏆</div>
              <div style={{ fontSize: '0.85rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.15em', color: '#fbbf24', marginBottom: '0.5rem' }}>
                CAMPEÃO
              </div>
              <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: '2rem', fontWeight: 900, color: 'var(--text-primary, #f8fafc)' }}>
                {champion.label}
              </div>
            </div>
          </div>
        )}

        <div style={{ display: 'flex', gap: '2rem', alignItems: 'flex-start', minWidth: 'max-content', padding: '0.5rem 1rem' }}>
          {orderedRounds.map(roundName => {
            const matches = knockout[roundName] ?? [];
            const style = ROUND_STYLES[roundName];
            return (
              <div key={roundName} style={{ 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center', 
                gap: '1rem',
                scrollSnapAlign: 'center', // Para o celular centralizar a coluna ao rolar
              }}>
                <div style={{
                  textAlign: 'center',
                  padding: '0.5rem 1.5rem',
                  borderRadius: '99px',
                  fontSize: '0.85rem', fontWeight: 900,
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                  background: style?.bg ?? 'var(--bg-surface, #1e293b)',
                  color: style?.text ?? 'var(--text-primary, #f8fafc)',
                  border: `2px solid ${style?.border ?? 'var(--border, #334155)'}`,
                  boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                }}>
                  {roundName}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
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
