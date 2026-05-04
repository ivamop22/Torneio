import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { prisma } from '../lib/prisma';

const ROUND_NAMES = ['Final', 'Semifinal', 'Quartas de Final', 'Oitavas de Final'];

function getRoundName(totalRounds: number, roundIndex: number): string {
  const stepsFromEnd = totalRounds - 1 - roundIndex;
  return ROUND_NAMES[stepsFromEnd] ?? `Round ${roundIndex + 1}`;
}

function isPowerOfTwo(value: number): boolean {
  return value >= 2 && (value & (value - 1)) === 0;
}

function buildBracketRounds(teamCount: number): number[] {
  const rounds: number[] = [];
  let matchesInRound = teamCount / 2;

  while (matchesInRound >= 1) {
    rounds.push(matchesInRound);
    matchesInRound = Math.floor(matchesInRound / 2);
  }

  return rounds;
}

function crossBracketSeed(teams: string[], groupCount: number, advancePerGroup: number): string[] {
  // 2 grupos, 2 avancam -> SF1: G1#1 vs G2#2 | SF2: G2#1 vs G1#2
  if (groupCount === 2 && advancePerGroup === 2 && teams.length === 4) {
    return [teams[0], teams[3], teams[1], teams[2]];
  }
  if (groupCount === 2 && advancePerGroup === 4 && teams.length === 8) {
    return [teams[0], teams[7], teams[2], teams[5], teams[1], teams[6], teams[3], teams[4]];
  }
  return teams;
}

function teamLabel(team: any): string {
  if (!team) return 'A definir';
  const p1 = team.player1?.fullName ?? '?';
  const p2 = team.player2?.fullName;
  return p2 ? `${p1} / ${p2}` : p1;
}

@Injectable()
export class DrawsService {
  async resetBracket(eventId: string) {
    await prisma.match.deleteMany({ where: { eventId } });
    await prisma.eventGroupStanding.deleteMany({ where: { eventGroup: { eventId } } });
    await prisma.eventGroup.deleteMany({ where: { eventId } });
    await prisma.draw.deleteMany({ where: { eventId } });
    await prisma.event.update({ where: { id: eventId }, data: { status: 'open' } });
    return { success: true, message: 'Chaveamento excluído com sucesso.' };
  }

  async generateGroupKnockout(eventId: string, groupCount = 2) {
    const teams = await prisma.team.findMany({
      where: { eventId, status: 'accepted', deletedAt: null },
      include: { player1: true, player2: true },
      orderBy: [{ seed: 'asc' }, { createdAt: 'asc' }],
    });

    if (teams.length < groupCount * 2) {
      throw new BadRequestException(`Minimo ${groupCount * 2} duplas necessarias para ${groupCount} grupos.`);
    }

    await prisma.match.deleteMany({ where: { eventId } });
    await prisma.eventGroupStanding.deleteMany({
      where: { eventGroup: { eventId } },
    });
    await prisma.eventGroup.deleteMany({ where: { eventId } });
    await prisma.draw.deleteMany({ where: { eventId } });

    const draw = await prisma.draw.create({
      data: {
        eventId,
        drawType: 'group_knockout',
        status: 'generated',
        generatedAt: new Date(),
        metadata: { groupCount, teamCount: teams.length },
      },
    });

    const groups: typeof teams[] = Array.from({ length: groupCount }, () => []);
    teams.forEach((team, i) => {
      const row = Math.floor(i / groupCount);
      const col = row % 2 === 0 ? i % groupCount : groupCount - 1 - (i % groupCount);
      groups[col].push(team);
    });

    const createdGroups: any[] = [];

    // Build all group records first, then batch-insert standings and matches
    for (let g = 0; g < groupCount; g++) {
      const groupName = String.fromCharCode(65 + g);

      const group = await prisma.eventGroup.create({
        data: { eventId, name: `Grupo ${groupName}`, position: g + 1 },
      });

      // Batch-insert all standings for this group (1 query per group instead of N)
      await prisma.eventGroupStanding.createMany({
        data: groups[g].map((team) => ({ eventGroupId: group.id, teamId: team.id })),
      });

      // Batch-insert all round-robin matches for this group (1 query per group instead of N)
      const groupTeams = groups[g];
      const matchRows: {
        eventId: string;
        drawId: string;
        groupId: string;
        roundName: string;
        matchNumber: number;
        team1Id: string;
        team2Id: string;
        status: string;
      }[] = [];
      let matchNum = 1;
      for (let i = 0; i < groupTeams.length; i++) {
        for (let j = i + 1; j < groupTeams.length; j++) {
          matchRows.push({
            eventId,
            drawId: draw.id,
            groupId: group.id,
            roundName: `Grupos - ${groupName}`,
            matchNumber: matchNum++,
            team1Id: groupTeams[i].id,
            team2Id: groupTeams[j].id,
            status: 'scheduled',
          });
        }
      }
      await prisma.match.createMany({ data: matchRows });

      createdGroups.push({ group, teams: groupTeams });
    }

    await prisma.event.update({
      where: { id: eventId },
      data: { status: 'live' },
    });

    return { draw, groups: createdGroups };
  }

  async recalculateStandings(groupId: string) {
    const standings = await prisma.eventGroupStanding.findMany({
      where: { eventGroupId: groupId },
    });

    const matches = await prisma.match.findMany({
      where: { groupId, status: 'completed' },
      include: { sets: true },
    });

    const stats: Record<string, any> = {};
    for (const s of standings) {
      stats[s.teamId] = {
        id: s.id,
        played: 0,
        wins: 0,
        losses: 0,
        walkovers: 0,
        setsFor: 0,
        setsAgainst: 0,
        gamesFor: 0,
        gamesAgainst: 0,
        points: 0,
      };
    }

    for (const match of matches) {
      if (!match.team1Id || !match.team2Id || !match.winnerTeamId) continue;
      const t1 = match.team1Id;
      const t2 = match.team2Id;
      const winner = match.winnerTeamId;
      const loser = winner === t1 ? t2 : t1;

      if (!stats[t1] || !stats[t2]) continue;

      stats[t1].played++;
      stats[t2].played++;

      if (match.walkover) {
        stats[winner].walkovers++;
        stats[winner].wins++;
        stats[winner].points += 2;
        stats[loser].losses++;
      } else {
        stats[winner].wins++;
        stats[winner].points += 2;
        stats[loser].losses++;
        stats[loser].points += 1;
      }

      let t1Sets = 0;
      let t2Sets = 0;
      for (const set of match.sets) {
        const g1 = set.team1Games;
        const g2 = set.team2Games;
        if (g1 > g2) t1Sets++;
        else t2Sets++;
        stats[t1].gamesFor += g1;
        stats[t1].gamesAgainst += g2;
        stats[t2].gamesFor += g2;
        stats[t2].gamesAgainst += g1;
      }
      stats[t1].setsFor += t1Sets;
      stats[t1].setsAgainst += t2Sets;
      stats[t2].setsFor += t2Sets;
      stats[t2].setsAgainst += t1Sets;
    }

    const sorted = standings
      .filter((s) => stats[s.teamId])
      .sort((a, b) => {
        const sa = stats[a.teamId];
        const sb = stats[b.teamId];
        if (sb.points !== sa.points) return sb.points - sa.points;
        const sdA = sa.setsFor - sa.setsAgainst;
        const sdB = sb.setsFor - sb.setsAgainst;
        if (sdB !== sdA) return sdB - sdA;
        const gdA = sa.gamesFor - sa.gamesAgainst;
        const gdB = sb.gamesFor - sb.gamesAgainst;
        if (gdB !== gdA) return gdB - gdA;
        return sb.gamesFor - sa.gamesFor;
      });

    // Batch all standing updates into a single transaction (eliminates N individual round-trips)
    await prisma.$transaction(
      sorted.map((s, i) => {
        const st = stats[s.teamId];
        return prisma.eventGroupStanding.update({
          where: { id: s.id },
          data: {
            played: st.played,
            wins: st.wins,
            losses: st.losses,
            walkovers: st.walkovers,
            setsFor: st.setsFor,
            setsAgainst: st.setsAgainst,
            gamesFor: st.gamesFor,
            gamesAgainst: st.gamesAgainst,
            points: st.points,
            rankPosition: i + 1,
          },
        });
      }),
    );

    return sorted.map((s, i) => ({ ...stats[s.teamId], teamId: s.teamId, rankPosition: i + 1 }));
  }

  async generateKnockout(eventId: string, advancePerGroup = 2) {
    const groups = await prisma.eventGroup.findMany({
      where: { eventId },
      orderBy: { position: 'asc' },
    });

    if (groups.length === 0) throw new NotFoundException('Nenhum grupo encontrado.');

    const draw = await prisma.draw.findFirst({
      where: { eventId },
      orderBy: { createdAt: 'desc' },
    });

    const teamsByGroup: string[][] = [];
    for (const group of groups) {
      const standings = await prisma.eventGroupStanding.findMany({
        where: { eventGroupId: group.id },
        orderBy: [{ rankPosition: 'asc' }, { points: 'desc' }],
      });
      teamsByGroup.push(standings.slice(0, advancePerGroup).map((s) => s.teamId));
    }

    const advancingTeams: string[] = [];
    for (let pos = 0; pos < advancePerGroup; pos++) {
      for (const groupTeams of teamsByGroup) {
        if (groupTeams[pos]) advancingTeams.push(groupTeams[pos]);
      }
    }

    const n = advancingTeams.length;
    if (!isPowerOfTwo(n)) {
      throw new BadRequestException(
        `O mata-mata precisa de 2, 4, 8 ou 16 classificados. Foram encontrados ${n}. Ajuste a quantidade de grupos/classificados.`,
      );
    }

    const rounds = buildBracketRounds(n);
    const seededTeams = crossBracketSeed(advancingTeams, groups.length, advancePerGroup);

    let matchCounter = 1;

    // Collect all matches across all rounds then batch-insert (1 query instead of N)
    const matchRows: {
      eventId: string;
      drawId: string | null;
      roundName: string;
      matchNumber: number;
      team1Id: string | null;
      team2Id: string | null;
      status: string;
    }[] = [];

    for (let r = 0; r < rounds.length; r++) {
      const roundName = getRoundName(rounds.length, r);
      const matchesInRound = rounds[r];

      for (let m = 0; m < matchesInRound; m++) {
        const team1Id = r === 0 ? (seededTeams[m * 2] ?? null) : null;
        const team2Id = r === 0 ? (seededTeams[m * 2 + 1] ?? null) : null;

        matchRows.push({
          eventId,
          drawId: draw?.id ?? null,
          roundName,
          matchNumber: matchCounter++,
          team1Id,
          team2Id,
          status: 'scheduled',
        });
      }
    }

    await prisma.match.createMany({ data: matchRows });

    // Return the created matches so callers can use them
    const createdMatches = await prisma.match.findMany({
      where: { eventId, groupId: null },
      orderBy: { matchNumber: 'asc' },
    });
    return createdMatches;
  }

  async autoAdvanceWinner(matchId: string) {
    const match = await prisma.match.findUnique({ where: { id: matchId } });
    if (!match || !match.winnerTeamId) return;

    if (match.groupId) {
      await this.recalculateStandings(match.groupId);
      await this.checkAndGenerateKnockout(match.eventId);
      return;
    }

    const allKnockout = await prisma.match.findMany({
      where: { eventId: match.eventId, groupId: null },
      orderBy: { matchNumber: 'asc' },
    });

    const roundMap = new Map<string, typeof allKnockout>();
    for (const m of allKnockout) {
      if (!roundMap.has(m.roundName)) roundMap.set(m.roundName, []);
      roundMap.get(m.roundName)!.push(m);
    }

    const roundNames = Array.from(roundMap.keys());
    const currentRoundIdx = roundNames.findIndex((r) =>
      roundMap.get(r)!.some((m) => m.id === matchId),
    );

    if (currentRoundIdx === -1) return;

    if (currentRoundIdx === roundNames.length - 1) {
      await this.detectChampion(match.eventId, match.winnerTeamId);
      return;
    }

    const currentRoundMatches = roundMap.get(roundNames[currentRoundIdx])!;
    const nextRoundMatches = roundMap.get(roundNames[currentRoundIdx + 1])!;

    const posInRound = currentRoundMatches.findIndex((m) => m.id === matchId);
    const nextMatchIdx = Math.floor(posInRound / 2);
    const slot = posInRound % 2;

    if (nextMatchIdx >= nextRoundMatches.length) return;

    const nextMatch = nextRoundMatches[nextMatchIdx];
    await prisma.match.update({
      where: { id: nextMatch.id },
      data: slot === 0
        ? { team1Id: match.winnerTeamId }
        : { team2Id: match.winnerTeamId },
    });
  }

  private async checkAndGenerateKnockout(eventId: string) {
    const groups = await prisma.eventGroup.findMany({ where: { eventId } });
    for (const g of groups) {
      const pending = await prisma.match.count({
        where: { groupId: g.id, status: { not: 'completed' } },
      });
      if (pending > 0) return;
    }

    const knockoutExists = await prisma.match.count({
      where: { eventId, groupId: null },
    });
    if (knockoutExists > 0) return;

    await this.generateKnockout(eventId, 2);
  }

  async detectChampion(eventId: string, winnerTeamId: string) {
    await prisma.event.update({
      where: { id: eventId },
      data: { status: 'finished' },
    });

    const team = await prisma.team.findUnique({ where: { id: winnerTeamId } });
    if (!team) return;

    const playerIds = [team.player1Id, team.player2Id].filter(Boolean) as string[];
    const rankingPoints = { 1: 1000, 2: 750 };

    for (const playerId of playerIds) {
      await prisma.ranking.create({
        data: {
          playerId,
          eventId,
          points: rankingPoints[1],
          rankingDate: new Date(),
          source: 'tournament_champion',
          metadata: { teamId: winnerTeamId, position: 1 },
        },
      });

      await prisma.player.update({
        where: { id: playerId },
        data: { rankingPoints: { increment: rankingPoints[1] } },
      });
    }

    const finalMatch = await prisma.match.findFirst({
      where: { eventId, roundName: 'Final', status: 'completed' },
    });
    if (finalMatch?.loserTeamId) {
      const loserTeam = await prisma.team.findUnique({ where: { id: finalMatch.loserTeamId } });
      const loserPlayers = [loserTeam?.player1Id, loserTeam?.player2Id].filter(Boolean) as string[];
      for (const playerId of loserPlayers) {
        await prisma.ranking.create({
          data: {
            playerId,
            eventId,
            points: rankingPoints[2],
            rankingDate: new Date(),
            source: 'tournament_finalist',
            metadata: { teamId: finalMatch.loserTeamId, position: 2 },
          },
        });
        await prisma.player.update({
          where: { id: playerId },
          data: { rankingPoints: { increment: rankingPoints[2] } },
        });
      }
    }
  }

  async getBracketData(eventId: string) {
    // --- Step 1: fetch structural data in parallel (3 queries) ---
    const [event, groups, allMatches] = await Promise.all([
      prisma.event.findUnique({ where: { id: eventId } }),
      prisma.eventGroup.findMany({ where: { eventId }, orderBy: { position: 'asc' } }),
      prisma.match.findMany({
        where: { eventId },
        orderBy: { matchNumber: 'asc' },
      }),
    ]);

    if (!event) throw new NotFoundException('Evento nao encontrado.');

    const knockoutMatches = allMatches.filter((m) => m.groupId === null);
    const groupMatchMap = new Map<string, typeof allMatches>();
    for (const m of allMatches) {
      if (m.groupId) {
        if (!groupMatchMap.has(m.groupId)) groupMatchMap.set(m.groupId, []);
        groupMatchMap.get(m.groupId)!.push(m);
      }
    }

    // --- Step 2: fetch all standings for all groups (1 query) ---
    const groupIds = groups.map((g) => g.id);
    const [allStandings, allMatchSets] = await Promise.all([
      groupIds.length
        ? prisma.eventGroupStanding.findMany({
            where: { eventGroupId: { in: groupIds } },
            orderBy: [{ rankPosition: 'asc' }, { points: 'desc' }],
          })
        : Promise.resolve([]),
      // Fetch all sets for all matches in this event (1 query)
      prisma.matchSet.findMany({
        where: { matchId: { in: allMatches.map((m) => m.id) } },
        orderBy: { setNumber: 'asc' },
      }),
    ]);

    // --- Step 3: collect all teamIds referenced anywhere, batch-fetch (1 query) ---
    const teamIdSet = new Set<string>();
    for (const m of allMatches) {
      if (m.team1Id) teamIdSet.add(m.team1Id);
      if (m.team2Id) teamIdSet.add(m.team2Id);
      if (m.winnerTeamId) teamIdSet.add(m.winnerTeamId);
    }
    for (const s of allStandings) {
      teamIdSet.add(s.teamId);
    }

    const teamsWithPlayers = teamIdSet.size
      ? await prisma.team.findMany({
          where: { id: { in: Array.from(teamIdSet) } },
          include: { player1: true, player2: true },
        })
      : [];

    // --- Build lookup maps ---
    const teamMap = new Map<string, (typeof teamsWithPlayers)[0]>();
    for (const t of teamsWithPlayers) teamMap.set(t.id, t);

    const setsByMatch = new Map<string, typeof allMatchSets>();
    for (const s of allMatchSets) {
      if (!setsByMatch.has(s.matchId)) setsByMatch.set(s.matchId, []);
      setsByMatch.get(s.matchId)!.push(s);
    }

    const standingsByGroup = new Map<string, typeof allStandings>();
    for (const s of allStandings) {
      if (!standingsByGroup.has(s.eventGroupId)) standingsByGroup.set(s.eventGroupId, []);
      standingsByGroup.get(s.eventGroupId)!.push(s);
    }

    // --- Helper: enrich team from map (no DB call) ---
    const enrichTeam = (teamId: string | null) => {
      if (!teamId) return null;
      const team = teamMap.get(teamId);
      return team ? { ...team, label: teamLabel(team) } : null;
    };

    // --- Assemble groups ---
    const groupsWithData = groups.map((group) => {
      const standings = standingsByGroup.get(group.id) ?? [];
      const matches = groupMatchMap.get(group.id) ?? [];

      const standingsWithTeams = standings.map((s) => ({
        ...s,
        team: enrichTeam(s.teamId),
      }));

      const matchesWithTeams = matches.map((m) => ({
        ...m,
        team1: enrichTeam(m.team1Id),
        team2: enrichTeam(m.team2Id),
        winner: enrichTeam(m.winnerTeamId),
        sets: setsByMatch.get(m.id) ?? [],
      }));

      return { ...group, standings: standingsWithTeams, matches: matchesWithTeams };
    });

    // --- Assemble knockout ---
    const knockoutWithTeams = knockoutMatches.map((m) => ({
      ...m,
      team1: enrichTeam(m.team1Id),
      team2: enrichTeam(m.team2Id),
      winner: enrichTeam(m.winnerTeamId),
      sets: setsByMatch.get(m.id) ?? [],
    }));

    const knockoutByRound: Record<string, any[]> = {};
    for (const m of knockoutWithTeams) {
      if (!knockoutByRound[m.roundName]) knockoutByRound[m.roundName] = [];
      knockoutByRound[m.roundName].push(m);
    }

    const finalMatch = knockoutWithTeams.find((m) => m.roundName === 'Final' && m.status === 'completed');
    const champion = finalMatch?.winner ?? null;

    return {
      event,
      groups: groupsWithData,
      knockout: knockoutByRound,
      knockoutRoundOrder: ['Oitavas de Final', 'Quartas de Final', 'Semifinal', 'Final'].filter(
        (r) => knockoutByRound[r],
      ),
      champion,
      isGroupPhase: groups.length > 0,
      isKnockoutPhase: knockoutMatches.length > 0,
    };
  }

  async assignMatchTeams(
    eventId: string,
    assignments: { matchId: string; team1Id: string | null; team2Id: string | null }[],
  ) {
    const event = await prisma.event.findUnique({ where: { id: eventId } });
    if (!event) throw new NotFoundException('Evento nao encontrado.');

    const completedMatch = await prisma.match.findFirst({
      where: { eventId, status: 'completed' },
    });
    if (completedMatch) {
      throw new BadRequestException(
        'Nao e possivel reatribuir duplas quando ja existem partidas concluidas para este evento.',
      );
    }

    const updated = [];
    for (const assignment of assignments) {
      const match = await prisma.match.update({
        where: { id: assignment.matchId },
        data: {
          team1Id: assignment.team1Id,
          team2Id: assignment.team2Id,
        },
        include: {
          team1: { include: { player1: true, player2: true } },
          team2: { include: { player1: true, player2: true } },
        },
      });
      updated.push(match);
    }

    return updated;
  }

  async getRanking(category?: string) {
    const players = await prisma.player.findMany({
      where: { active: true, deletedAt: null },
      orderBy: { rankingPoints: 'desc' },
      take: 100,
    });

    return players.map((p, i) => ({
      position: i + 1,
      playerId: p.id,
      name: p.fullName,
      points: p.rankingPoints,
      nationality: p.nationality,
    }));
  }
}
