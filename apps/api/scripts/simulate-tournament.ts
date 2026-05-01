import { prisma } from '../src/lib/prisma';
import { DrawsService } from '../src/draws/draws.service';

const modalities = [
  { value: 'male', label: 'Masculino' },
  { value: 'female', label: 'Feminino' },
  { value: 'mixed', label: 'Mista' },
] as const;

const ageGroups = [
  { value: 'infantil', label: 'Infantil' },
  { value: 'junior', label: 'Junior' },
  { value: 'adulto', label: 'Adulto' },
] as const;

const classLevels = ['A', 'B', 'C', 'D'] as const;

type Modality = (typeof modalities)[number];

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');
}

function playerGender(modality: Modality, playerIndex: number) {
  if (modality.value === 'female') return 'female';
  if (modality.value === 'male') return 'male';
  return playerIndex % 2 === 0 ? 'female' : 'male';
}

async function createPlayer(fullName: string, gender: string, email: string) {
  return prisma.player.upsert({
    where: { email },
    update: { fullName, gender, active: true, deletedAt: null },
    create: {
      fullName,
      gender,
      email,
      nationality: 'BR',
      eligibilityStatus: 'eligible',
      active: true,
    },
  });
}

async function createAcceptedTeam(eventId: string, modality: Modality, seed: number, prefix: string) {
  const p1Gender = playerGender(modality, 1);
  const p2Gender = playerGender(modality, 2);
  const p1 = await createPlayer(
    `${prefix} Atleta ${seed}A`,
    p1Gender,
    `${slugify(prefix)}-${seed}a@simulacao.local`,
  );
  const p2 = await createPlayer(
    `${prefix} Atleta ${seed}B`,
    p2Gender,
    `${slugify(prefix)}-${seed}b@simulacao.local`,
  );

  await prisma.eventPlayer.upsert({
    where: { eventId_playerId: { eventId, playerId: p1.id } },
    update: { status: 'accepted' },
    create: { eventId, playerId: p1.id, status: 'accepted' },
  });
  await prisma.eventPlayer.upsert({
    where: { eventId_playerId: { eventId, playerId: p2.id } },
    update: { status: 'accepted' },
    create: { eventId, playerId: p2.id, status: 'accepted' },
  });

  const existing = await prisma.team.findFirst({
    where: {
      eventId,
      deletedAt: null,
      OR: [
        { player1Id: p1.id, player2Id: p2.id },
        { player1Id: p2.id, player2Id: p1.id },
      ],
    },
  });

  if (existing) {
    return prisma.team.update({ where: { id: existing.id }, data: { seed, status: 'accepted' } });
  }

  return prisma.team.create({
    data: {
      eventId,
      player1Id: p1.id,
      player2Id: p2.id,
      seed,
      status: 'accepted',
    },
  });
}

async function completeMatch(drawsService: DrawsService, matchId: string) {
  const match = await prisma.match.findUnique({ where: { id: matchId } });
  if (!match?.team1Id || !match.team2Id) return false;

  await prisma.match.update({
    where: { id: match.id },
    data: {
      status: 'completed',
      winnerTeamId: match.team1Id,
      loserTeamId: match.team2Id,
      startedAt: new Date(),
      finishedAt: new Date(),
    },
  });

  await prisma.matchSet.createMany({
    data: [
      { matchId: match.id, setNumber: 1, team1Games: 6, team2Games: 3 },
      { matchId: match.id, setNumber: 2, team1Games: 6, team2Games: 4 },
    ],
    skipDuplicates: true,
  });

  await drawsService.autoAdvanceWinner(match.id);
  return true;
}

async function finishEvent(drawsService: DrawsService, eventId: string) {
  const groupMatches = await prisma.match.findMany({
    where: { eventId, groupId: { not: null }, status: 'scheduled' },
    orderBy: [{ roundName: 'asc' }, { matchNumber: 'asc' }],
  });

  for (const match of groupMatches) {
    await completeMatch(drawsService, match.id);
  }

  const rounds = ['Quartas de Final', 'Semifinal', 'Final'];
  for (const roundName of rounds) {
    let matches = await prisma.match.findMany({
      where: { eventId, groupId: null, roundName, status: 'scheduled' },
      orderBy: { matchNumber: 'asc' },
    });

    while (matches.length > 0) {
      for (const match of matches) {
        await completeMatch(drawsService, match.id);
      }
      matches = await prisma.match.findMany({
        where: { eventId, groupId: null, roundName, status: 'scheduled' },
        orderBy: { matchNumber: 'asc' },
      });
    }
  }
}

async function main() {
  const drawsService = new DrawsService();
  const stamp = new Date().toISOString().replace(/[-:T.Z]/g, '').slice(0, 14);
  const tournamentName = `Simulacao Beach Tennis ${stamp}`;
  const slug = slugify(tournamentName);

  const tournament = await prisma.tournament.create({
    data: {
      name: tournamentName,
      slug,
      status: 'open',
      level: 'recreational',
      startDate: new Date(),
      endDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
      city: 'Vila Velha',
      state: 'ES',
      country: 'BR',
      organizer_notes: 'Torneio criado automaticamente para teste completo de fluxo.',
    },
  });

  const events = [];
  for (const modality of modalities) {
    for (const ageGroup of ageGroups) {
      for (const classLevel of classLevels) {
        const category = `${ageGroup.label} ${classLevel}`;
        const event = await prisma.event.create({
          data: {
            tournamentId: tournament.id,
            name: `${modality.label} ${category}`,
            gender: modality.value,
            format: 'group_knockout',
            category,
            level: classLevel,
            minPairs: 4,
            maxPairs: 32,
            status: 'open',
          },
        });
        events.push({ event, modality, ageGroup, classLevel });
      }
    }
  }

  for (const item of events) {
    const prefix = `${item.modality.label} ${item.ageGroup.label} ${item.classLevel}`;
    for (let seed = 1; seed <= 4; seed++) {
      await createAcceptedTeam(item.event.id, item.modality, seed, prefix);
    }
    await drawsService.generateGroupKnockout(item.event.id, 2);
  }

  const finished = events.find(
    (item) => item.modality.value === 'mixed' && item.ageGroup.value === 'adulto' && item.classLevel === 'C',
  );
  if (finished) {
    await finishEvent(drawsService, finished.event.id);
  }

  const eventCount = await prisma.event.count({ where: { tournamentId: tournament.id } });
  const teamCount = await prisma.team.count({ where: { event: { tournamentId: tournament.id } } });
  const matchCount = await prisma.match.count({ where: { event: { tournamentId: tournament.id } } });
  const completedMatches = await prisma.match.count({
    where: { event: { tournamentId: tournament.id }, status: 'completed' },
  });
  const championEvent = finished
    ? await drawsService.getBracketData(finished.event.id)
    : null;

  console.log(JSON.stringify({
    tournament: {
      id: tournament.id,
      name: tournament.name,
      slug: tournament.slug,
      publicPath: `/torneios/${tournament.slug}`,
    },
    totals: {
      events: eventCount,
      teams: teamCount,
      matches: matchCount,
      completedMatches,
    },
    finishedEvent: finished?.event.name ?? null,
    champion: championEvent?.champion?.label ?? null,
  }, null, 2));
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
