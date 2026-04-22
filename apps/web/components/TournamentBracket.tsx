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

function SetScore({ sets, team1Id, team2Id }: { sets: MatchSet[]; team1Id?: string; team2Id?: string }) {
  if (!sets.length) return null;
  return (
    <div className="flex gap-1 mt-1">
      {sets.map((s) => (
        <span key={s.setNumber} className="text-xs bg-slate-700 px-1.5 py-0.5 rounded font-mono">
          {s.team1Games}-{s.team2Games}
          {s.tieBreakTeam1 != null ? `(${s.tieBreakTeam1})` : ''}
        </span>
      ))}
    </div>
  );
}

function MatchCard({
  match,
  apiUrl,
  onRefresh,
}: {
  match: Match;
  apiUrl: string;
  onRefresh: () => void;
}) {
  const isCompleted = match.status === 'completed';
  const isLive = match.status === 'live';

  async function submitResult(winnerTeamId: string, loserTeamId: string) {
    await fetch(`${apiUrl}/matches/${match.id}/result`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ winnerTeamId, loserTeamId }),
    });
    onRefresh();
  }

  const teamRow = (team: Team | null, isWinner: boolean, slot: 1 | 2) => {
    const opponent = slot === 1 ? match.team2 : match.team1;
    return (
      <div
        className={`flex items-center justify-between px-3 py-2 rounded transition-all ${
          isCompleted && isWinner
            ? 'bg-emerald-900/50 border border-emerald-600/50'
            : isCompleted && !isWinner
            ? 'bg-slate-800/30 opacity-50'
            : 'bg-slate-800'
        }`}
      >
        <div className="flex items-center gap-2 min-w-0">
          {isCompleted && isWinner && (
            <span className="text-emerald-400 text-xs">✓</span>
          )}
          <span
            className={`text-sm truncate font-medium ${
              !team ? 'text-slate-500 italic' : isCompleted && isWinner ? 'text-emerald-300' : 'text-slate-200'
            }`}
          >
            {team?.label ?? 'A definir'}
          </span>
        </div>
        {/* Botão de vitória (apenas quando não finalizado e há 2 times) */}
        {!isCompleted && match.team1 && match.team2 && team && opponent && (
          <button
            onClick={() => submitResult(team.id, opponent.id)}
            className="ml-2 text-xs bg-slate-700 hover:bg-emerald-700 text-slate-300 hover:text-white px-2 py-0.5 rounded transition-colors shrink-0"
            title={`${team.label} venceu`}
          >
            Venceu
          </button>
        )}
      </div>
    );
  };

  return (
    <div
      className={`rounded-lg border transition-all ${
        isLive
          ? 'border-amber-500/70 shadow-lg shadow-amber-900/30'
          : isCompleted
          ? 'border-slate-700'
          : 'border-slate-700/50'
      } bg-slate-900 overflow-hidden min-w-[220px] max-w-[260px]`}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-slate-800/60 border-b border-slate-700/50">
        <span className="text-xs text-slate-400">#{match.matchNumber}</span>
        <span
          className={`text-xs font-medium px-1.5 py-0.5 rounded ${
            isLive
              ? 'bg-amber-500/20 text-amber-400 score-live'
              : isCompleted
              ? 'bg-emerald-900/30 text-emerald-400'
              : 'bg-slate-700/50 text-slate-400'
          }`}
        >
          {isLive ? '🔴 AO VIVO' : isCompleted ? 'Concluído' : 'Agendado'}
        </span>
      </div>

      {/* Times */}
      <div className="p-2 space-y-1.5">
        {teamRow(match.team1, match.winner?.id === match.team1?.id, 1)}
        <div className="text-center text-xs text-slate-600 font-bold">VS</div>
        {teamRow(match.team2, match.winner?.id === match.team2?.id, 2)}
      </div>

      {/* Sets */}
      {match.sets.length > 0 && (
        <div className="px-3 pb-2">
          <SetScore sets={match.sets} />
        </div>
      )}
    </div>
  );
}

export function TournamentBracket({ knockout, roundOrder, champion, apiUrl, onRefresh }: Props) {
  if (roundOrder.length === 0) {
    return (
      <div className="text-center py-16 text-slate-500">
        <div className="text-4xl mb-3">🎾</div>
        <p className="text-lg font-medium">Fase de grupos em andamento</p>
        <p className="text-sm mt-1">O mata-mata será gerado automaticamente quando a fase de grupos terminar.</p>
      </div>
    );
  }

  // Ordenar da primeira rodada até a final
  const orderedRounds = [...roundOrder].reverse();

  return (
    <div className="w-full">
      {/* Campeão */}
      {champion && (
        <div className="mb-8 text-center">
          <div className="inline-block champion-glow bg-gradient-to-br from-yellow-900/60 to-amber-900/60 border-2 border-yellow-500 rounded-2xl px-8 py-5">
            <div className="trophy-bounce text-4xl mb-2">🏆</div>
            <div className="text-yellow-400 text-xs font-bold uppercase tracking-widest mb-1">Campeão</div>
            <div className="text-white text-xl font-bold">{champion.label}</div>
          </div>
        </div>
      )}

      {/* Bracket */}
      <div className="overflow-x-auto pb-4">
        <div className="flex gap-8 items-start min-w-max px-4">
          {orderedRounds.map((roundName) => {
            const matches = knockout[roundName] ?? [];
            return (
              <div key={roundName} className="flex flex-col items-center gap-2">
                {/* Round header */}
                <div className={`text-center mb-4 px-4 py-1.5 rounded-full text-sm font-bold uppercase tracking-wider ${
                  roundName === 'Final'
                    ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/40'
                    : roundName === 'Semifinal'
                    ? 'bg-purple-500/20 text-purple-400 border border-purple-500/40'
                    : 'bg-slate-700/50 text-slate-400 border border-slate-600/40'
                }`}>
                  {roundName}
                </div>

                {/* Partidas desta rodada */}
                <div className={`flex flex-col gap-6 ${
                  roundName === 'Final' ? 'justify-center' : ''
                }`}>
                  {matches.map((match) => (
                    <MatchCard
                      key={match.id}
                      match={match}
                      apiUrl={apiUrl}
                      onRefresh={onRefresh}
                    />
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
