/**
 * =============================================================================
 * SEED: Tournament Profiles FIPSAS
 * =============================================================================
 * Percorso: prisma/seed-tournament-profiles.ts
 * Creato: 2026-01-12
 * Descrizione: Seed dei profili torneo standard FIPSAS
 *
 * Esecuzione: npx ts-node prisma/seed-tournament-profiles.ts
 *
 * Profili Standard FIPSAS:
 * - Big Game Tradizionale (peso)
 * - Big Game Catch & Release
 * - Drifting Tradizionale
 * - Drifting Catch & Release
 * - Traina Costiera Tradizionale
 * - Traina Costiera Catch & Release
 * - Bolentino
 * - Vertical Jigging
 * - Shore Fishing
 * - Social/Amatoriale
 * =============================================================================
 */

import { PrismaClient, TournamentDiscipline, TournamentLevel, GameMode } from '@prisma/client';

const prisma = new PrismaClient();

// Configurazioni punteggi C&R per specie comuni
const bigGameSpeciesScoring = [
  {
    speciesId: "tonno-rosso",
    speciesName: "Tonno Rosso",
    pointsSmall: 500,
    pointsMedium: 750,
    pointsLarge: 1000,
    pointsExtraLarge: 1500,
    thresholdSmallCm: 100,
    thresholdMediumCm: 150,
    thresholdLargeCm: 200,
    catchReleaseBonus: 100,
  },
  {
    speciesId: "pesce-spada",
    speciesName: "Pesce Spada",
    pointsSmall: 400,
    pointsMedium: 600,
    pointsLarge: 900,
    pointsExtraLarge: 1300,
    thresholdSmallCm: 120,
    thresholdMediumCm: 180,
    thresholdLargeCm: 240,
    catchReleaseBonus: 100,
  },
  {
    speciesId: "alalunga",
    speciesName: "Alalunga",
    pointsSmall: 200,
    pointsMedium: 350,
    pointsLarge: 500,
    pointsExtraLarge: 750,
    thresholdSmallCm: 60,
    thresholdMediumCm: 80,
    thresholdLargeCm: 100,
    catchReleaseBonus: 50,
  },
  {
    speciesId: "ricciola",
    speciesName: "Ricciola",
    pointsSmall: 150,
    pointsMedium: 300,
    pointsLarge: 500,
    pointsExtraLarge: 800,
    thresholdSmallCm: 50,
    thresholdMediumCm: 80,
    thresholdLargeCm: 110,
    catchReleaseBonus: 50,
  },
];

const driftingSpeciesScoring = [
  {
    speciesId: "tonno-rosso",
    speciesName: "Tonno Rosso",
    pointsSmall: 600,
    pointsMedium: 900,
    pointsLarge: 1200,
    pointsExtraLarge: 1800,
    thresholdSmallCm: 100,
    thresholdMediumCm: 150,
    thresholdLargeCm: 200,
    catchReleaseBonus: 150,
  },
  {
    speciesId: "alalunga",
    speciesName: "Alalunga",
    pointsSmall: 250,
    pointsMedium: 400,
    pointsLarge: 600,
    pointsExtraLarge: 900,
    thresholdSmallCm: 60,
    thresholdMediumCm: 80,
    thresholdLargeCm: 100,
    catchReleaseBonus: 75,
  },
  {
    speciesId: "lampuga",
    speciesName: "Lampuga",
    pointsSmall: 100,
    pointsMedium: 200,
    pointsLarge: 350,
    pointsExtraLarge: 500,
    thresholdSmallCm: 40,
    thresholdMediumCm: 60,
    thresholdLargeCm: 80,
    catchReleaseBonus: 25,
  },
];

const trainaCostieraSpeciesScoring = [
  {
    speciesId: "ricciola",
    speciesName: "Ricciola",
    pointsSmall: 100,
    pointsMedium: 200,
    pointsLarge: 350,
    pointsExtraLarge: 550,
    thresholdSmallCm: 40,
    thresholdMediumCm: 60,
    thresholdLargeCm: 85,
    catchReleaseBonus: 30,
  },
  {
    speciesId: "dentice",
    speciesName: "Dentice",
    pointsSmall: 80,
    pointsMedium: 150,
    pointsLarge: 250,
    pointsExtraLarge: 400,
    thresholdSmallCm: 25,
    thresholdMediumCm: 40,
    thresholdLargeCm: 55,
    catchReleaseBonus: 25,
  },
  {
    speciesId: "spigola",
    speciesName: "Spigola",
    pointsSmall: 60,
    pointsMedium: 120,
    pointsLarge: 200,
    pointsExtraLarge: 320,
    thresholdSmallCm: 30,
    thresholdMediumCm: 45,
    thresholdLargeCm: 60,
    catchReleaseBonus: 20,
  },
  {
    speciesId: "leccia",
    speciesName: "Leccia",
    pointsSmall: 80,
    pointsMedium: 160,
    pointsLarge: 280,
    pointsExtraLarge: 450,
    thresholdSmallCm: 35,
    thresholdMediumCm: 55,
    thresholdLargeCm: 75,
    catchReleaseBonus: 25,
  },
];

// URL regolamento FIPSAS
const FIPSAS_REGULATION_URL = "https://www.fipsas.it/pesca-di-superficie/discipline-pesca-di-superficie/mare/big-game/circolare-normativa-big-game";

async function seedTournamentProfiles() {
  console.log('🎯 Seeding Tournament Profiles FIPSAS...\n');

  const profiles = [
    // BIG GAME
    {
      name: "FIPSAS Big Game Tradizionale",
      description: "Profilo ufficiale FIPSAS per tornei Big Game con punteggio basato sul peso. Disciplina regina della pesca d'altura.",
      isSystemProfile: true,
      discipline: TournamentDiscipline.BIG_GAME,
      level: TournamentLevel.NATIONAL,
      gameMode: GameMode.TRADITIONAL,
      followsFipsasRules: true,
      fipsasRegulationUrl: FIPSAS_REGULATION_URL,
      defaultMinWeight: 30, // kg minimo per big game
      defaultMaxCatchesPerDay: 3,
      defaultPointsPerKg: 1,
      defaultBonusPoints: 0,
      displayOrder: 1,
    },
    {
      name: "FIPSAS Big Game Catch & Release",
      description: "Profilo ufficiale FIPSAS per tornei Big Game in modalita Catch & Release. Punteggio per specie e taglia stimata.",
      isSystemProfile: true,
      discipline: TournamentDiscipline.BIG_GAME,
      level: TournamentLevel.NATIONAL,
      gameMode: GameMode.CATCH_RELEASE,
      followsFipsasRules: true,
      fipsasRegulationUrl: FIPSAS_REGULATION_URL,
      defaultMinWeight: null,
      defaultMaxCatchesPerDay: 5,
      defaultPointsPerKg: 0,
      defaultBonusPoints: 0,
      speciesScoringConfig: JSON.stringify(bigGameSpeciesScoring),
      displayOrder: 2,
    },

    // DRIFTING
    {
      name: "FIPSAS Drifting Tradizionale",
      description: "Profilo ufficiale FIPSAS per tornei Drifting con punteggio basato sul peso. Pesca alla deriva con esche vive.",
      isSystemProfile: true,
      discipline: TournamentDiscipline.DRIFTING,
      level: TournamentLevel.NATIONAL,
      gameMode: GameMode.TRADITIONAL,
      followsFipsasRules: true,
      fipsasRegulationUrl: FIPSAS_REGULATION_URL,
      defaultMinWeight: 5, // kg minimo
      defaultMaxCatchesPerDay: 5,
      defaultPointsPerKg: 1,
      defaultBonusPoints: 0,
      displayOrder: 3,
    },
    {
      name: "FIPSAS Drifting Catch & Release",
      description: "Profilo ufficiale FIPSAS per tornei Drifting in modalita Catch & Release. Pesca alla deriva con rilascio.",
      isSystemProfile: true,
      discipline: TournamentDiscipline.DRIFTING,
      level: TournamentLevel.NATIONAL,
      gameMode: GameMode.CATCH_RELEASE,
      followsFipsasRules: true,
      fipsasRegulationUrl: FIPSAS_REGULATION_URL,
      defaultMinWeight: null,
      defaultMaxCatchesPerDay: 8,
      defaultPointsPerKg: 0,
      defaultBonusPoints: 0,
      speciesScoringConfig: JSON.stringify(driftingSpeciesScoring),
      displayOrder: 4,
    },

    // TRAINA COSTIERA
    {
      name: "FIPSAS Traina Costiera Tradizionale",
      description: "Profilo ufficiale FIPSAS per tornei Traina Costiera con punteggio basato sul peso. Pesca sotto costa con artificiali.",
      isSystemProfile: true,
      discipline: TournamentDiscipline.TRAINA_COSTIERA,
      level: TournamentLevel.REGIONAL,
      gameMode: GameMode.TRADITIONAL,
      followsFipsasRules: true,
      fipsasRegulationUrl: FIPSAS_REGULATION_URL,
      defaultMinWeight: 1, // kg minimo
      defaultMaxCatchesPerDay: 10,
      defaultPointsPerKg: 1,
      defaultBonusPoints: 0,
      displayOrder: 5,
    },
    {
      name: "FIPSAS Traina Costiera Catch & Release",
      description: "Profilo ufficiale FIPSAS per tornei Traina Costiera in modalita Catch & Release.",
      isSystemProfile: true,
      discipline: TournamentDiscipline.TRAINA_COSTIERA,
      level: TournamentLevel.REGIONAL,
      gameMode: GameMode.CATCH_RELEASE,
      followsFipsasRules: true,
      fipsasRegulationUrl: FIPSAS_REGULATION_URL,
      defaultMinWeight: null,
      defaultMaxCatchesPerDay: 15,
      defaultPointsPerKg: 0,
      defaultBonusPoints: 0,
      speciesScoringConfig: JSON.stringify(trainaCostieraSpeciesScoring),
      displayOrder: 6,
    },

    // BOLENTINO
    {
      name: "FIPSAS Bolentino",
      description: "Profilo ufficiale FIPSAS per tornei Bolentino. Pesca a fondo con canna da natante.",
      isSystemProfile: true,
      discipline: TournamentDiscipline.BOLENTINO,
      level: TournamentLevel.REGIONAL,
      gameMode: GameMode.TRADITIONAL,
      followsFipsasRules: true,
      fipsasRegulationUrl: FIPSAS_REGULATION_URL,
      defaultMinWeight: 0.2, // 200g minimo
      defaultMaxCatchesPerDay: 20,
      defaultPointsPerKg: 1,
      defaultBonusPoints: 0,
      displayOrder: 7,
    },

    // VERTICAL JIGGING
    {
      name: "FIPSAS Vertical Jigging",
      description: "Profilo ufficiale FIPSAS per tornei Vertical Jigging. Pesca con jig metallici in verticale.",
      isSystemProfile: true,
      discipline: TournamentDiscipline.VERTICAL_JIGGING,
      level: TournamentLevel.REGIONAL,
      gameMode: GameMode.TRADITIONAL,
      followsFipsasRules: true,
      fipsasRegulationUrl: FIPSAS_REGULATION_URL,
      defaultMinWeight: 0.5, // 500g minimo
      defaultMaxCatchesPerDay: 10,
      defaultPointsPerKg: 1,
      defaultBonusPoints: 0,
      displayOrder: 8,
    },

    // EGING
    {
      name: "FIPSAS Eging",
      description: "Profilo ufficiale FIPSAS per tornei Eging. Pesca ai cefalopodi con egi.",
      isSystemProfile: true,
      discipline: TournamentDiscipline.EGING,
      level: TournamentLevel.REGIONAL,
      gameMode: GameMode.TRADITIONAL,
      followsFipsasRules: true,
      fipsasRegulationUrl: FIPSAS_REGULATION_URL,
      defaultMinWeight: 0.1, // 100g minimo
      defaultMaxCatchesPerDay: 15,
      defaultPointsPerKg: 1,
      defaultBonusPoints: 0,
      displayOrder: 9,
    },

    // SHORE
    {
      name: "FIPSAS Shore Fishing",
      description: "Profilo ufficiale FIPSAS per tornei Shore Fishing. Pesca da riva con varie tecniche.",
      isSystemProfile: true,
      discipline: TournamentDiscipline.SHORE,
      level: TournamentLevel.REGIONAL,
      gameMode: GameMode.TRADITIONAL,
      followsFipsasRules: true,
      fipsasRegulationUrl: FIPSAS_REGULATION_URL,
      defaultMinWeight: 0.15, // 150g minimo
      defaultMaxCatchesPerDay: 20,
      defaultPointsPerKg: 1,
      defaultBonusPoints: 0,
      displayOrder: 10,
    },

    // SOCIAL
    {
      name: "Torneo Sociale / Amatoriale",
      description: "Profilo per tornei sociali e amatoriali. Regole flessibili, ideale per eventi di club.",
      isSystemProfile: true,
      discipline: TournamentDiscipline.SOCIAL,
      level: TournamentLevel.CLUB,
      gameMode: GameMode.TRADITIONAL,
      followsFipsasRules: false,
      fipsasRegulationUrl: null,
      defaultMinWeight: null, // nessun minimo
      defaultMaxCatchesPerDay: null, // illimitato
      defaultPointsPerKg: 1,
      defaultBonusPoints: 10, // bonus partecipazione
      displayOrder: 11,
    },
  ];

  for (const profile of profiles) {
    const existing = await prisma.tournamentProfile.findFirst({
      where: {
        name: profile.name,
        isSystemProfile: true,
      },
    });

    if (existing) {
      console.log(`  - Aggiornando: ${profile.name}`);
      await prisma.tournamentProfile.update({
        where: { id: existing.id },
        data: profile,
      });
    } else {
      console.log(`  + Creando: ${profile.name}`);
      await prisma.tournamentProfile.create({
        data: profile,
      });
    }
  }

  console.log(`\n✅ Creati/aggiornati ${profiles.length} profili torneo FIPSAS`);

  // Mostra riepilogo
  const count = await prisma.tournamentProfile.count({
    where: { isSystemProfile: true },
  });
  console.log(`📊 Totale profili sistema nel database: ${count}`);
}

seedTournamentProfiles()
  .catch((e) => {
    console.error('❌ Errore durante il seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
