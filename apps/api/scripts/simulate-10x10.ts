/**
 * Simulação: 10 jogadores + 10 jogadoras
 * Cria 1 torneio com 2 eventos (Masculino + Feminino Adulto A)
 * 5 duplas masculinas + 5 duplas femininas → gera chaveamento e simula todas as partidas
 */

import * as fs from 'fs';
import * as path from 'path';

function loadEnv(filePath: string) {
  if (!fs.existsSync(filePath)) return;
  for (const line of fs.readFileSync(filePath, 'utf8').split(/\r?\n/)) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const sep = t.indexOf('=');
    if (sep === -1) continue;
    const key = t.slice(0, sep).trim();
    const val = t.slice(sep + 1).trim().replace(/^['"]|['"]$/g, '');
    if (key && process.env[key] === undefined) process.env[key] = val;
  }
}

const root = path.resolve(__dirname, '../../..');
loadEnv(path.join(root, '.env'));
loadEnv(path.join(root, 'apps/api/.env'));
if (!process.env.DIRECT_URL && process.env.DATABASE_URL) process.env.DIRECT_URL = process.env.DATABASE_URL;

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL não encontrada no .env');
  process.exit(1);
}

const { prisma } = require('../src/lib/prisma');
const { DrawsService } = require('../src/draws/draws.service');

// ── Dados dos atletas ──────────────────────────────────────────────────────────
const JOGADORES = [
  { nome: 'Rafael Maciel',    email: 'rafael.maciel@sim.local'    },
  { nome: 'Bruno Tavares',    email: 'bruno.tavares@sim.local'    },
  { nome: 'Lucas Andrade',    email: 'lucas.andrade@sim.local'    },
  { nome: 'Thiago Ferreira',  email: 'thiago.ferreira@sim.local'  },
  { nome: 'Felipe Costa',     email: 'felipe.costa@sim.local'     },
  { nome: 'Gustavo Neves',    email: 'gustavo.neves@sim.local'    },
  { nome: 'Diego Martins',    email: 'diego.martins@sim.local'    },
  { nome: 'Rodrigo Alves',    email: 'rodrigo.alves@sim.local'    },
  { nome: 'Carlos Oliveira',  email: 'carlos.oliveira@sim.local'  },
  { nome: 'André Souza',      email: 'andre.souza@sim.local'      },
];

const JOGADORAS = [
  { nome: 'Ana Paula Lima',   email: 'ana.lima@sim.local'         },
  { nome: 'Fernanda Rocha',   email: 'fernanda.rocha@sim.local'   },
  { nome: 'Juliana Santos',   email: 'juliana.santos@sim.local'   },
  { nome: 'Camila Pereira',   email: 'camila.pereira@sim.local'   },
  { nome: 'Larissa Vieira',   email: 'larissa.vieira@sim.local'   },
  { nome: 'Beatriz Carvalho', email: 'beatriz.carvalho@sim.local' },
  { nome: 'Mariana Gomes',    email: 'mariana.gomes@sim.local'    },
  { nome: 'Patrícia Mendes',  email: 'patricia.mendes@sim.local'  },
  { nome: 'Vanessa Ribeiro',  email: 'vanessa.ribeiro@sim.local'  },
  { nome: 'Aline Barros',     email: 'aline.barros@sim.local'     },
];

// ── Resultados de sets variados para tornar o chaveamento mais realista ─────────
const RESULTADOS_POSSIVEIS = [
  [{ team1Games: 6, team2Games: 3 }, { team1Games: 6, team2Games: 4 }],
  [{ team1Games: 6, team2Games: 2 }, { team1Games: 6, team2Games: 1 }],
  [{ team1Games: 7, team2Games: 5 }, { team1Games: 6, team2Games: 4 }],
  [{ team1Games: 6, team2Games: 4 }, { team1Games: 3, team2Games: 6 }, { team1Games: 6, team2Games: 3 }],
  [{ team1Games: 6, team2Games: 0 }, { team1Games: 6, team2Games: 2 }],
  [{ team1Games: 7, team2Games: 6, tieBreak1: 7, tieBreak2: 4 }, { team1Games: 6, team2Games: 4 }],
  [{ team1Games: 6, team2Games: 3 }, { team1Games: 5, team2Games: 7 }, { team1Games: 6, team2Games: 4 }],
];

let resultadoIdx = 0;
function proximoResultado() {
  return RESULTADOS_POSSIVEIS[resultadoIdx++ % RESULTADOS_POSSIVEIS.length];
}

// ── Helpers ──────────────────────────────────────────────────────────────────
async function upsertPlayer(nome: string, email: string, gender: string) {
  const existing = await prisma.player.findFirst({ where: { email, deletedAt: null } });
  if (existing) {
    return prisma.player.update({ where: { id: existing.id }, data: { fullName: nome, gender, active: true, deletedAt: null } });
  }
  return prisma.player.create({ data: { fullName: nome, gender, email, nationality: 'BR', eligibilityStatus: 'eligible', active: true } });
}

async function criarDupla(eventId: string, p1Id: string, p2Id: string, seed: number) {
  const existing = await prisma.team.findFirst({
    where: { eventId, deletedAt: null, OR: [{ player1Id: p1Id, player2Id: p2Id }, { player1Id: p2Id, player2Id: p1Id }] },
  });
  if (existing) return prisma.team.update({ where: { id: existing.id }, data: { seed, status: 'accepted' } });
  return prisma.team.create({ data: { eventId, player1Id: p1Id, player2Id: p2Id, seed, status: 'accepted' } });
}

async function simularPartida(drawsService: any, matchId: string) {
  const match = await prisma.match.findUnique({ where: { id: matchId } });
  if (!match?.team1Id || !match.team2Id) return false;

  const sets = proximoResultado();

  await prisma.match.update({
    where: { id: matchId },
    data: {
      status: 'completed',
      winnerTeamId: match.team1Id,
      loserTeamId: match.team2Id,
      startedAt: new Date(),
      finishedAt: new Date(),
    },
  });

  await prisma.matchSet.createMany({
    data: sets.map((s, i) => ({
      matchId,
      setNumber: i + 1,
      team1Games: s.team1Games,
      team2Games: s.team2Games,
      tieBreakTeam1: (s as any).tieBreak1 ?? null,
      tieBreakTeam2: (s as any).tieBreak2 ?? null,
    })),
    skipDuplicates: true,
  });

  await drawsService.autoAdvanceWinner(matchId);
  return true;
}

async function simularEvento(drawsService: any, eventId: string) {
  // 1. Fase de grupos
  const grupoPartidas = await prisma.match.findMany({
    where: { eventId, groupId: { not: null }, status: 'scheduled' },
    orderBy: [{ roundName: 'asc' }, { matchNumber: 'asc' }],
  });
  for (const m of grupoPartidas) {
    await simularPartida(drawsService, m.id);
  }

  // 2. Mata-mata (rodadas progressivas)
  for (const roundName of ['Quartas de Final', 'Semifinal', 'Final']) {
    let rodada = await prisma.match.findMany({
      where: { eventId, groupId: null, roundName, status: 'scheduled' },
      orderBy: { matchNumber: 'asc' },
    });
    let tentativas = 0;
    while (rodada.length > 0 && tentativas < 10) {
      for (const m of rodada) await simularPartida(drawsService, m.id);
      rodada = await prisma.match.findMany({
        where: { eventId, groupId: null, roundName, status: 'scheduled' },
        orderBy: { matchNumber: 'asc' },
      });
      tentativas++;
    }
  }
}

// ── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  const drawsService = new DrawsService();

  const stamp = new Date().toISOString().slice(0, 10);
  const slug  = `arena-open-${stamp}-${Date.now()}`;

  console.log('🏆  Criando torneio...');
  const torneio = await prisma.tournament.create({
    data: {
      name: `Arena Open ${stamp}`,
      slug,
      status: 'ongoing',
      level: 'recreational',
      startDate: new Date(),
      endDate: new Date(Date.now() + 2 * 86400000),
      city: 'Vila Velha',
      state: 'ES',
      country: 'BR',
    },
  });
  console.log(`   ✓ ${torneio.name}  (${torneio.id})`);

  // ── Criar eventos ──────────────────────────────────────────────────────────
  console.log('\n📋  Criando eventos...');
  const evMasc = await prisma.event.create({
    data: {
      tournamentId: torneio.id,
      name: 'Masculino Adulto A',
      gender: 'male', format: 'group_knockout',
      category: 'Adulto A', status: 'open',
      minPairs: 4, maxPairs: 16,
    },
  });
  const evFem = await prisma.event.create({
    data: {
      tournamentId: torneio.id,
      name: 'Feminino Adulto A',
      gender: 'female', format: 'group_knockout',
      category: 'Adulto A', status: 'open',
      minPairs: 4, maxPairs: 16,
    },
  });
  console.log(`   ✓ ${evMasc.name}`);
  console.log(`   ✓ ${evFem.name}`);

  // ── Registrar jogadores ────────────────────────────────────────────────────
  console.log('\n👤  Registrando jogadores...');
  const masc = await Promise.all(JOGADORES.map(j => upsertPlayer(j.nome, j.email, 'male')));
  const fem  = await Promise.all(JOGADORAS.map(j => upsertPlayer(j.nome, j.email, 'female')));
  console.log(`   ✓ ${masc.length} jogadores masculinos`);
  console.log(`   ✓ ${fem.length} jogadoras femininas`);

  // ── Formar duplas (pares sequenciais, 0+1, 2+3, …) ─────────────────────────
  console.log('\n👥  Formando duplas...');
  const duplasMasc: any[] = [];
  for (let i = 0; i < 10; i += 2) {
    const d = await criarDupla(evMasc.id, masc[i].id, masc[i + 1].id, i / 2 + 1);
    duplasMasc.push(d);
    console.log(`   ✓ Masc #${i / 2 + 1}: ${masc[i].fullName} / ${masc[i + 1].fullName}`);
  }

  const duplasFem: any[] = [];
  for (let i = 0; i < 10; i += 2) {
    const d = await criarDupla(evFem.id, fem[i].id, fem[i + 1].id, i / 2 + 1);
    duplasFem.push(d);
    console.log(`   ✓ Fem  #${i / 2 + 1}: ${fem[i].fullName} / ${fem[i + 1].fullName}`);
  }

  // ── Gerar chaveamentos ─────────────────────────────────────────────────────
  console.log('\n🎯  Gerando chaveamentos (2 grupos cada)...');
  await drawsService.generateGroupKnockout(evMasc.id, 2);
  await drawsService.generateGroupKnockout(evFem.id, 2);
  console.log('   ✓ Chaveamentos gerados');

  // ── Simular todas as partidas ──────────────────────────────────────────────
  console.log('\n⚡  Simulando partidas masculinas...');
  await simularEvento(drawsService, evMasc.id);

  console.log('⚡  Simulando partidas femininas...');
  await simularEvento(drawsService, evFem.id);

  // ── Resultados ─────────────────────────────────────────────────────────────
  const bracketMasc = await drawsService.getBracketData(evMasc.id);
  const bracketFem  = await drawsService.getBracketData(evFem.id);

  const totalPartidas = await prisma.match.count({ where: { eventId: { in: [evMasc.id, evFem.id] } } });
  const concluidas    = await prisma.match.count({ where: { eventId: { in: [evMasc.id, evFem.id] }, status: 'completed' } });

  console.log('\n══════════════════════════════════════════════');
  console.log('🏆  RESULTADOS DA SIMULAÇÃO');
  console.log('══════════════════════════════════════════════');
  console.log(`\nTorneio : ${torneio.name}`);
  console.log(`URL     : /torneios/${torneio.slug}`);
  console.log(`\nPartidas: ${concluidas}/${totalPartidas} concluídas`);
  console.log(`\n🥇 Campeão Masculino : ${bracketMasc.champion?.label ?? '(em disputa)'}`);
  console.log(`🥇 Campeã  Feminina  : ${bracketFem.champion?.label  ?? '(em disputa)'}`);
  console.log('\n══════════════════════════════════════════════');

  console.log(JSON.stringify({
    torneio: { id: torneio.id, nome: torneio.name, slug: torneio.slug, url: `/torneios/${torneio.slug}` },
    partidas: { total: totalPartidas, concluidas },
    campeoMasculino: bracketMasc.champion?.label ?? null,
    campeaFeminina:  bracketFem.champion?.label  ?? null,
  }, null, 2));
}

main()
  .catch(e => { console.error(e); process.exitCode = 1; })
  .finally(() => prisma.$disconnect());
