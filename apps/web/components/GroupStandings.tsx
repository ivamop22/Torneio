'use client';

type Team = {
  id: string;
  label: string;
};

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

function RankBadge({ pos }: { pos: number }) {
  const colors: Record<number, string> = {
    1: 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/40',
    2: 'bg-slate-600/40 text-slate-300 border border-slate-500/40',
    3: 'bg-amber-800/30 text-amber-500 border border-amber-600/40',
  };
  return (
    <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold ${colors[pos] ?? 'bg-slate-700 text-slate-400'}`}>
      {pos}
    </span>
  );
}

export function GroupStandings({ groups, apiUrl, onRefresh }: Props) {
  if (groups.length === 0) {
    return (
      <div className="text-center py-12 text-slate-500">
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
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {groups.map((group) => (
        <div key={group.id} className="bg-slate-900 rounded-xl border border-slate-700/60 overflow-hidden">
          {/* Header do grupo */}
          <div className="px-5 py-3 bg-slate-800/60 border-b border-slate-700/50 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary-600 flex items-center justify-center text-white font-bold text-sm">
              {group.name.replace('Grupo ', '')}
            </div>
            <h3 className="font-bold text-slate-200">{group.name}</h3>
            <span className="ml-auto text-xs text-slate-500">
              {group.standings.length} duplas
            </span>
          </div>

          {/* Tabela de classificação */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-slate-500 border-b border-slate-800">
                  <th className="px-3 py-2 text-left">#</th>
                  <th className="px-3 py-2 text-left">Dupla</th>
                  <th className="px-3 py-2 text-center">J</th>
                  <th className="px-3 py-2 text-center">V</th>
                  <th className="px-3 py-2 text-center">D</th>
                  <th className="px-3 py-2 text-center">Sets</th>
                  <th className="px-3 py-2 text-center font-bold text-slate-400">Pts</th>
                </tr>
              </thead>
              <tbody>
                {group.standings.map((s, idx) => {
                  const isClassified = idx < 2; // Top 2 avançam
                  return (
                    <tr
                      key={s.id}
                      className={`border-b border-slate-800/50 transition-colors ${
                        isClassified ? 'hover:bg-emerald-900/10' : 'hover:bg-slate-800/20 opacity-80'
                      }`}
                    >
                      <td className="px-3 py-2.5">
                        <RankBadge pos={s.rankPosition ?? idx + 1} />
                      </td>
                      <td className="px-3 py-2.5">
                        <div className="flex items-center gap-2">
                          {isClassified && (
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" title="Classificado" />
                          )}
                          <span className={`font-medium truncate max-w-[160px] ${isClassified ? 'text-slate-200' : 'text-slate-400'}`}>
                            {s.team?.label ?? 'Desconhecido'}
                          </span>
                        </div>
                      </td>
                      <td className="px-3 py-2.5 text-center text-slate-400">{s.played}</td>
                      <td className="px-3 py-2.5 text-center text-emerald-400">{s.wins}</td>
                      <td className="px-3 py-2.5 text-center text-red-400">{s.losses}</td>
                      <td className="px-3 py-2.5 text-center text-slate-400 text-xs">
                        {s.setsFor}/{s.setsAgainst}
                      </td>
                      <td className="px-3 py-2.5 text-center">
                        <span className="font-bold text-white">{s.points}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Legenda */}
          <div className="px-4 py-2 bg-slate-900/50 border-t border-slate-800 flex items-center gap-3 text-xs text-slate-500">
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              Classificado para o mata-mata
            </span>
          </div>

          {/* Partidas do grupo */}
          {group.matches.length > 0 && (
            <div className="border-t border-slate-800">
              <div className="px-4 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Partidas
              </div>
              <div className="space-y-1 px-3 pb-3">
                {group.matches.map((match) => {
                  const isCompleted = match.status === 'completed';
                  return (
                    <div
                      key={match.id}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm ${
                        isCompleted ? 'bg-slate-800/30' : 'bg-slate-800/60'
                      }`}
                    >
                      <span className="text-slate-600 text-xs w-5 shrink-0">#{match.matchNumber}</span>

                      {/* Time 1 */}
                      <span className={`truncate flex-1 text-right ${
                        isCompleted && match.winner?.id === match.team1?.id
                          ? 'text-emerald-400 font-semibold'
                          : 'text-slate-300'
                      }`}>
                        {match.team1?.label ?? '?'}
                      </span>

                      {/* Score / VS */}
                      <div className="shrink-0 text-center">
                        {isCompleted && match.sets.length > 0 ? (
                          <div className="flex gap-1">
                            {match.sets.map((s) => (
                              <span key={s.setNumber} className="text-xs font-mono bg-slate-700 px-1 rounded">
                                {s.team1Games}-{s.team2Games}
                              </span>
                            ))}
                          </div>
                        ) : isCompleted ? (
                          <span className="text-emerald-500 text-xs">✓</span>
                        ) : (
                          <span className="text-slate-600 text-xs font-bold">VS</span>
                        )}
                      </div>

                      {/* Time 2 */}
                      <span className={`truncate flex-1 ${
                        isCompleted && match.winner?.id === match.team2?.id
                          ? 'text-emerald-400 font-semibold'
                          : 'text-slate-300'
                      }`}>
                        {match.team2?.label ?? '?'}
                      </span>

                      {/* Botão de resultado */}
                      {!isCompleted && match.team1 && match.team2 && (
                        <div className="flex gap-1 shrink-0">
                          <button
                            onClick={() => submitResult(match.id, match.team1!.id, match.team2!.id)}
                            className="text-xs bg-emerald-800/50 hover:bg-emerald-700 text-emerald-300 px-2 py-0.5 rounded transition-colors"
                          >
                            1 vence
                          </button>
                          <button
                            onClick={() => submitResult(match.id, match.team2!.id, match.team1!.id)}
                            className="text-xs bg-blue-800/50 hover:bg-blue-700 text-blue-300 px-2 py-0.5 rounded transition-colors"
                          >
                            2 vence
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
      ))}
    </div>
  );
}
