import { BadRequestException, Body, Controller, Post } from '@nestjs/common';
import { prisma } from '../lib/prisma';

type Modality = 'male' | 'female' | 'mixed';
type AgeGroup = 'infantil' | 'junior' | 'adulto';
type ClassLevel = 'A' | 'B' | 'C' | 'D';

const MODALITY_LABEL: Record<Modality, string> = {
  male: 'Masculino',
  female: 'Feminino',
  mixed: 'Mista',
};

const AGE_LABEL: Record<AgeGroup, string> = {
  infantil: 'Infantil',
  junior: 'Junior',
  adulto: 'Adulto',
};

function normalize(value: string) {
  return value.trim().toLowerCase();
}

function requiredString(value: unknown, field: string) {
  if (typeof value !== 'string' || !value.trim()) {
    throw new BadRequestException(`${field} e obrigatorio.`);
  }
  return value.trim();
}

function assertOption<T extends string>(value: string, options: readonly T[], field: string): T {
  if (!options.includes(value as T)) {
    throw new BadRequestException(`${field} invalido.`);
  }
  return value as T;
}

async function findOrCreatePlayer(body: {
  fullName: string;
  gender?: string;
  email?: string;
  phone?: string;
  nationality?: string;
}) {
  const email = body.email?.trim().toLowerCase() || null;

  const existing = email
    ? await prisma.player.findFirst({ where: { email, deletedAt: null } })
    : await prisma.player.findFirst({
        where: {
          fullName: { equals: body.fullName.trim(), mode: 'insensitive' },
          deletedAt: null,
        },
      });

  if (existing) {
    return prisma.player.update({
      where: { id: existing.id },
      data: {
        fullName: body.fullName.trim(),
        gender: body.gender || existing.gender,
        email: email ?? existing.email,
        phone: body.phone?.trim() || existing.phone,
        nationality: body.nationality?.trim() || existing.nationality || 'BR',
        active: true,
      },
    });
  }

  return prisma.player.create({
    data: {
      fullName: body.fullName.trim(),
      gender: body.gender || null,
      email,
      phone: body.phone?.trim() || null,
      nationality: body.nationality?.trim() || 'BR',
    },
  });
}

@Controller('registrations')
export class RegistrationsController {
  @Post('public')
  async publicRegistration(
    @Body()
    body: {
      tournamentId?: string;
      tournamentName?: string;
      athleteName?: string;
      athleteGender?: string;
      athleteEmail?: string;
      athletePhone?: string;
      partnerName?: string;
      partnerGender?: string;
      partnerEmail?: string;
      modality?: string;
      ageGroup?: string;
      classLevel?: string;
    },
  ) {
    const athleteName = requiredString(body.athleteName, 'Nome do atleta');
    const modality = assertOption(normalize(requiredString(body.modality, 'Modalidade')), ['male', 'female', 'mixed'] as const, 'Modalidade');
    const ageGroup = assertOption(normalize(requiredString(body.ageGroup, 'Categoria de idade')), ['infantil', 'junior', 'adulto'] as const, 'Categoria de idade');
    const classLevel = assertOption(requiredString(body.classLevel, 'Classe').toUpperCase(), ['A', 'B', 'C', 'D'] as const, 'Classe');

    const tournament = body.tournamentId
      ? await prisma.tournament.findFirst({ where: { id: body.tournamentId, deleted_at: null } })
      : await prisma.tournament.findFirst({
          where: {
            name: { equals: requiredString(body.tournamentName, 'Nome do torneio'), mode: 'insensitive' },
            deleted_at: null,
          },
        });

    if (!tournament) {
      throw new BadRequestException('Torneio nao encontrado. Confira o nome do torneio.');
    }

    const category = `${AGE_LABEL[ageGroup]} ${classLevel}`;
    const eventName = `${MODALITY_LABEL[modality]} ${category}`;

    const event =
      (await prisma.event.findFirst({
        where: {
          tournamentId: tournament.id,
          gender: modality,
          category,
          deletedAt: null,
        },
      })) ??
      (await prisma.event.create({
        data: {
          tournamentId: tournament.id,
          name: eventName,
          gender: modality,
          format: 'group_knockout',
          category,
          status: 'open',
        },
      }));

    const athlete = await findOrCreatePlayer({
      fullName: athleteName,
      gender: body.athleteGender,
      email: body.athleteEmail,
      phone: body.athletePhone,
      nationality: 'BR',
    });

    await prisma.eventPlayer.upsert({
      where: { eventId_playerId: { eventId: event.id, playerId: athlete.id } },
      update: { status: 'accepted' },
      create: { eventId: event.id, playerId: athlete.id, status: 'accepted' },
    });

    let partner = null;
    let team = null;
    const partnerName = body.partnerName?.trim();

    if (partnerName) {
      partner = await findOrCreatePlayer({
        fullName: partnerName,
        gender: body.partnerGender,
        email: body.partnerEmail,
        nationality: 'BR',
      });

      if (partner.id === athlete.id) {
        throw new BadRequestException('O parceiro precisa ser um atleta diferente.');
      }

      if (modality === 'mixed') {
        const genders = [athlete.gender, partner.gender].filter(Boolean).sort();
        if (genders.length === 2 && genders.join('-') !== 'female-male') {
          throw new BadRequestException('Dupla mista precisa ter um atleta feminino e um masculino.');
        }
      }

      await prisma.eventPlayer.upsert({
        where: { eventId_playerId: { eventId: event.id, playerId: partner.id } },
        update: { status: 'accepted' },
        create: { eventId: event.id, playerId: partner.id, status: 'accepted' },
      });

      const existingTeam = await prisma.team.findFirst({
        where: {
          eventId: event.id,
          deletedAt: null,
          OR: [
            { player1Id: athlete.id, player2Id: partner.id },
            { player1Id: partner.id, player2Id: athlete.id },
          ],
        },
      });

      team =
        existingTeam ??
        (await prisma.team.create({
          data: {
            eventId: event.id,
            player1Id: athlete.id,
            player2Id: partner.id,
            status: 'accepted',
          },
        }));
    }

    return {
      tournament,
      event,
      athlete,
      partner,
      team,
      message: team
        ? 'Inscricao da dupla confirmada.'
        : 'Atleta inscrito. Informe o parceiro depois para formar a dupla.',
    };
  }
}
