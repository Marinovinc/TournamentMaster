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

    // =========================================================================
    // ACQUE INTERNE
    // =========================================================================

    // SPINNING ACQUE INTERNE
    {
      name: "FIPSAS Spinning Acque Interne",
      description: "Profilo ufficiale FIPSAS per tornei Spinning in acque interne. Pesca a spinning in laghi e fiumi.",
      isSystemProfile: true,
      discipline: TournamentDiscipline.SPINNING_FRESHWATER,
      level: TournamentLevel.REGIONAL,
      gameMode: GameMode.TRADITIONAL,
      followsFipsasRules: true,
      fipsasRegulationUrl: "https://www.fipsas.it/pesca-in-acque-interne",
      defaultMinWeight: 0.2, // 200g minimo
      defaultMaxCatchesPerDay: 10,
      defaultPointsPerKg: 1,
      defaultBonusPoints: 0,
      displayOrder: 11,
    },
    {
      name: "FIPSAS Spinning Acque Interne C&R",
      description: "Profilo FIPSAS per tornei Spinning in acque interne con Catch & Release obbligatorio.",
      isSystemProfile: true,
      discipline: TournamentDiscipline.SPINNING_FRESHWATER,
      level: TournamentLevel.REGIONAL,
      gameMode: GameMode.CATCH_RELEASE,
      followsFipsasRules: true,
      fipsasRegulationUrl: "https://www.fipsas.it/pesca-in-acque-interne",
      defaultMinWeight: null,
      defaultMaxCatchesPerDay: 15,
      defaultPointsPerKg: 0,
      defaultBonusPoints: 0,
      displayOrder: 12,
    },

    // CARPFISHING
    {
      name: "FIPSAS Carpfishing",
      description: "Profilo ufficiale FIPSAS per tornei Carpfishing. Sessioni di 24-48h con Catch & Release.",
      isSystemProfile: true,
      discipline: TournamentDiscipline.CARPFISHING,
      level: TournamentLevel.NATIONAL,
      gameMode: GameMode.CATCH_RELEASE,
      followsFipsasRules: true,
      fipsasRegulationUrl: "https://www.fipsas.it/pesca-in-acque-interne/discipline/carpfishing",
      defaultMinWeight: null,
      defaultMaxCatchesPerDay: null, // illimitato
      defaultPointsPerKg: 0,
      defaultBonusPoints: 0,
      displayOrder: 13,
    },

    // FEEDER
    {
      name: "FIPSAS Feeder",
      description: "Profilo ufficiale FIPSAS per tornei Feeder. Pesca a fondo con pasturatore in acque interne.",
      isSystemProfile: true,
      discipline: TournamentDiscipline.FEEDER,
      level: TournamentLevel.REGIONAL,
      gameMode: GameMode.TRADITIONAL,
      followsFipsasRules: true,
      fipsasRegulationUrl: "https://www.fipsas.it/pesca-in-acque-interne/discipline/feeder",
      defaultMinWeight: 0.05, // 50g minimo
      defaultMaxCatchesPerDay: null, // illimitato
      defaultPointsPerKg: 1,
      defaultBonusPoints: 0,
      displayOrder: 14,
    },

    // MATCH FISHING (Pesca al colpo)
    {
      name: "FIPSAS Pesca al Colpo",
      description: "Profilo ufficiale FIPSAS per tornei Pesca al Colpo (Match Fishing). Tecnica classica con canna fissa o bolognese.",
      isSystemProfile: true,
      discipline: TournamentDiscipline.MATCH_FISHING,
      level: TournamentLevel.NATIONAL,
      gameMode: GameMode.TRADITIONAL,
      followsFipsasRules: true,
      fipsasRegulationUrl: "https://www.fipsas.it/pesca-in-acque-interne/discipline/colpo",
      defaultMinWeight: 0.02, // 20g minimo
      defaultMaxCatchesPerDay: null, // illimitato
      defaultPointsPerKg: 1,
      defaultBonusPoints: 0,
      displayOrder: 15,
    },

    // FLY FISHING (Pesca a mosca)
    {
      name: "FIPSAS Pesca a Mosca",
      description: "Profilo ufficiale FIPSAS per tornei Pesca a Mosca (Fly Fishing). Tecnica con coda di topo e mosche artificiali.",
      isSystemProfile: true,
      discipline: TournamentDiscipline.FLY_FISHING,
      level: TournamentLevel.NATIONAL,
      gameMode: GameMode.CATCH_RELEASE,
      followsFipsasRules: true,
      fipsasRegulationUrl: "https://www.fipsas.it/pesca-in-acque-interne/discipline/mosca",
      defaultMinWeight: null,
      defaultMaxCatchesPerDay: 20,
      defaultPointsPerKg: 0,
      defaultBonusPoints: 0,
      displayOrder: 16,
    },

    // TROTA LAGO
    {
      name: "FIPSAS Trota Lago",
      description: "Profilo ufficiale FIPSAS per tornei Trota Lago. Pesca alla trota in laghi e laghetti.",
      isSystemProfile: true,
      discipline: TournamentDiscipline.TROTA_LAGO,
      level: TournamentLevel.REGIONAL,
      gameMode: GameMode.TRADITIONAL,
      followsFipsasRules: true,
      fipsasRegulationUrl: "https://www.fipsas.it/pesca-in-acque-interne/discipline/trota-lago",
      defaultMinWeight: 0.2, // 200g minimo
      defaultMaxCatchesPerDay: 10,
      defaultPointsPerKg: 1,
      defaultBonusPoints: 0,
      displayOrder: 17,
    },

    // TROTA TORRENTE
    {
      name: "FIPSAS Trota Torrente",
      description: "Profilo ufficiale FIPSAS per tornei Trota Torrente. Pesca alla trota in torrenti e fiumi montani.",
      isSystemProfile: true,
      discipline: TournamentDiscipline.TROTA_TORRENTE,
      level: TournamentLevel.REGIONAL,
      gameMode: GameMode.CATCH_RELEASE,
      followsFipsasRules: true,
      fipsasRegulationUrl: "https://www.fipsas.it/pesca-in-acque-interne/discipline/trota-torrente",
      defaultMinWeight: null,
      defaultMaxCatchesPerDay: 15,
      defaultPointsPerKg: 0,
      defaultBonusPoints: 0,
      displayOrder: 18,
    },

    // BASS FISHING
    {
      name: "FIPSAS Bass Fishing",
      description: "Profilo ufficiale FIPSAS per tornei Bass Fishing. Pesca al persico trota (black bass) con tecniche americane.",
      isSystemProfile: true,
      discipline: TournamentDiscipline.BASS_FISHING,
      level: TournamentLevel.NATIONAL,
      gameMode: GameMode.CATCH_RELEASE,
      followsFipsasRules: true,
      fipsasRegulationUrl: "https://www.fipsas.it/pesca-in-acque-interne/discipline/bass",
      defaultMinWeight: null,
      defaultMaxCatchesPerDay: 5, // limite 5 pesci
      defaultPointsPerKg: 0,
      defaultBonusPoints: 0,
      displayOrder: 19,
    },

    // PREDATORI
    {
      name: "FIPSAS Predatori Acque Interne",
      description: "Profilo ufficiale FIPSAS per tornei Predatori. Pesca a luccio, lucioperca, siluro e altri predatori.",
      isSystemProfile: true,
      discipline: TournamentDiscipline.PREDATORI,
      level: TournamentLevel.REGIONAL,
      gameMode: GameMode.CATCH_RELEASE,
      followsFipsasRules: true,
      fipsasRegulationUrl: "https://www.fipsas.it/pesca-in-acque-interne/discipline/predatori",
      defaultMinWeight: null,
      defaultMaxCatchesPerDay: 10,
      defaultPointsPerKg: 0,
      defaultBonusPoints: 0,
      displayOrder: 20,
    },


    // =========================================================================
    // MARE - DISCIPLINE AGGIUNTIVE FIPSAS
    // =========================================================================

    // SURF CASTING
    {
      name: "FIPSAS Surf Casting",
      description: "Profilo ufficiale FIPSAS per tornei Surf Casting. Pesca dalla spiaggia con lancio lungo.",
      isSystemProfile: true,
      discipline: TournamentDiscipline.SURF_CASTING,
      level: TournamentLevel.NATIONAL,
      gameMode: GameMode.TRADITIONAL,
      followsFipsasRules: true,
      fipsasRegulationUrl: "https://www.fipsas.it/pesca-di-superficie/discipline-pesca-di-superficie/mare/surf-casting",
      defaultMinWeight: 0.1, // 100g minimo
      defaultMaxCatchesPerDay: null, // illimitato
      defaultPointsPerKg: 1,
      defaultBonusPoints: 0,
      displayOrder: 21,
    },

    // CANNA DA NATANTE
    {
      name: "FIPSAS Pesca con Canna da Natante",
      description: "Profilo ufficiale FIPSAS per tornei Pesca con Canna da Natante. Pesca a bordo con tecniche varie.",
      isSystemProfile: true,
      discipline: TournamentDiscipline.CANNA_NATANTE,
      level: TournamentLevel.REGIONAL,
      gameMode: GameMode.TRADITIONAL,
      followsFipsasRules: true,
      fipsasRegulationUrl: "https://www.fipsas.it/pesca-di-superficie/discipline-pesca-di-superficie/mare/canna-natante",
      defaultMinWeight: 0.1,
      defaultMaxCatchesPerDay: null,
      defaultPointsPerKg: 1,
      defaultBonusPoints: 0,
      displayOrder: 22,
    },

    // CANNA DA RIVA
    {
      name: "FIPSAS Pesca con Canna da Riva",
      description: "Profilo ufficiale FIPSAS per tornei Pesca con Canna da Riva. Pesca dalla costa con diverse tecniche.",
      isSystemProfile: true,
      discipline: TournamentDiscipline.CANNA_RIVA,
      level: TournamentLevel.REGIONAL,
      gameMode: GameMode.TRADITIONAL,
      followsFipsasRules: true,
      fipsasRegulationUrl: "https://www.fipsas.it/pesca-di-superficie/discipline-pesca-di-superficie/mare/canna-riva",
      defaultMinWeight: 0.05,
      defaultMaxCatchesPerDay: null,
      defaultPointsPerKg: 1,
      defaultBonusPoints: 0,
      displayOrder: 23,
    },

    // KAYAK FISHING MARE
    {
      name: "FIPSAS Kayak Fishing Mare",
      description: "Profilo ufficiale FIPSAS per tornei Kayak Fishing in mare. Pesca da kayak in acque salate.",
      isSystemProfile: true,
      discipline: TournamentDiscipline.KAYAK_FISHING_MARE,
      level: TournamentLevel.REGIONAL,
      gameMode: GameMode.CATCH_RELEASE,
      followsFipsasRules: true,
      fipsasRegulationUrl: "https://www.fipsas.it/pesca-di-superficie/discipline-pesca-di-superficie/mare/kayak-fishing",
      defaultMinWeight: null,
      defaultMaxCatchesPerDay: 10,
      defaultPointsPerKg: 0,
      defaultBonusPoints: 0,
      displayOrder: 24,
    },

    // =========================================================================
    // ACQUE INTERNE - DISCIPLINE AGGIUNTIVE FIPSAS
    // =========================================================================

    // PESCA AL COLPO (nuova enum)
    {
      name: "FIPSAS Pesca al Colpo (nuova)",
      description: "Profilo ufficiale FIPSAS per tornei Pesca al Colpo. Tecnica classica con canna fissa o bolognese.",
      isSystemProfile: true,
      discipline: TournamentDiscipline.PESCA_COLPO,
      level: TournamentLevel.NATIONAL,
      gameMode: GameMode.TRADITIONAL,
      followsFipsasRules: true,
      fipsasRegulationUrl: "https://www.fipsas.it/pesca-in-acque-interne/discipline/colpo",
      defaultMinWeight: 0.02,
      defaultMaxCatchesPerDay: null,
      defaultPointsPerKg: 1,
      defaultBonusPoints: 0,
      displayOrder: 25,
    },

    // PREDATORI DA BARCA
    {
      name: "FIPSAS Predatori da Barca",
      description: "Profilo ufficiale FIPSAS per tornei Predatori con esche artificiali da barca.",
      isSystemProfile: true,
      discipline: TournamentDiscipline.PREDATORI_BARCA,
      level: TournamentLevel.REGIONAL,
      gameMode: GameMode.CATCH_RELEASE,
      followsFipsasRules: true,
      fipsasRegulationUrl: "https://www.fipsas.it/pesca-in-acque-interne/discipline/predatori-barca",
      defaultMinWeight: null,
      defaultMaxCatchesPerDay: 10,
      defaultPointsPerKg: 0,
      defaultBonusPoints: 0,
      displayOrder: 26,
    },

    // BELLY BOAT
    {
      name: "FIPSAS Pesca da Belly Boat",
      description: "Profilo ufficiale FIPSAS per tornei Pesca da Belly Boat. Pesca in galleggiante individuale.",
      isSystemProfile: true,
      discipline: TournamentDiscipline.BELLY_BOAT,
      level: TournamentLevel.REGIONAL,
      gameMode: GameMode.CATCH_RELEASE,
      followsFipsasRules: true,
      fipsasRegulationUrl: "https://www.fipsas.it/pesca-in-acque-interne/discipline/belly-boat",
      defaultMinWeight: null,
      defaultMaxCatchesPerDay: 15,
      defaultPointsPerKg: 0,
      defaultBonusPoints: 0,
      displayOrder: 27,
    },

    // STREET FISHING
    {
      name: "FIPSAS Street Fishing",
      description: "Profilo ufficiale FIPSAS per tornei Street Fishing. Pesca urbana in canali e fiumi cittadini.",
      isSystemProfile: true,
      discipline: TournamentDiscipline.STREET_FISHING,
      level: TournamentLevel.REGIONAL,
      gameMode: GameMode.CATCH_RELEASE,
      followsFipsasRules: true,
      fipsasRegulationUrl: "https://www.fipsas.it/pesca-in-acque-interne/discipline/street-fishing",
      defaultMinWeight: null,
      defaultMaxCatchesPerDay: 20,
      defaultPointsPerKg: 0,
      defaultBonusPoints: 0,
      displayOrder: 28,
    },

    // TROUT AREA
    {
      name: "FIPSAS Trout Area",
      description: "Profilo ufficiale FIPSAS per tornei Trout Area. Pesca alla trota in laghetti sportivi con esche artificiali.",
      isSystemProfile: true,
      discipline: TournamentDiscipline.TROUT_AREA,
      level: TournamentLevel.REGIONAL,
      gameMode: GameMode.CATCH_RELEASE,
      followsFipsasRules: true,
      fipsasRegulationUrl: "https://www.fipsas.it/pesca-in-acque-interne/discipline/trout-area",
      defaultMinWeight: null,
      defaultMaxCatchesPerDay: null, // illimitato
      defaultPointsPerKg: 0,
      defaultBonusPoints: 0,
      displayOrder: 29,
    },

    // PESCA IN FIUME
    {
      name: "FIPSAS Pesca in Fiume",
      description: "Profilo ufficiale FIPSAS per tornei Pesca in Fiume. Tecniche varie in ambienti fluviali.",
      isSystemProfile: true,
      discipline: TournamentDiscipline.PESCA_FIUME,
      level: TournamentLevel.REGIONAL,
      gameMode: GameMode.TRADITIONAL,
      followsFipsasRules: true,
      fipsasRegulationUrl: "https://www.fipsas.it/pesca-in-acque-interne/discipline/fiume",
      defaultMinWeight: 0.05,
      defaultMaxCatchesPerDay: null,
      defaultPointsPerKg: 1,
      defaultBonusPoints: 0,
      displayOrder: 30,
    },

    // BILANCELLA
    {
      name: "FIPSAS Pesca con Bilancella",
      description: "Profilo ufficiale FIPSAS per tornei Pesca con Bilancella. Tecnica tradizionale con rete a bilanciere.",
      isSystemProfile: true,
      discipline: TournamentDiscipline.BILANCELLA,
      level: TournamentLevel.REGIONAL,
      gameMode: GameMode.TRADITIONAL,
      followsFipsasRules: true,
      fipsasRegulationUrl: "https://www.fipsas.it/pesca-in-acque-interne/discipline/bilancella",
      defaultMinWeight: 0.01,
      defaultMaxCatchesPerDay: null,
      defaultPointsPerKg: 1,
      defaultBonusPoints: 0,
      displayOrder: 31,
    },

    // STORIONE
    {
      name: "FIPSAS Pesca allo Storione",
      description: "Profilo ufficiale FIPSAS per tornei Pesca allo Storione. Pesca al grande pesce in laghetti dedicati.",
      isSystemProfile: true,
      discipline: TournamentDiscipline.STORIONE,
      level: TournamentLevel.REGIONAL,
      gameMode: GameMode.CATCH_RELEASE,
      followsFipsasRules: true,
      fipsasRegulationUrl: "https://www.fipsas.it/pesca-in-acque-interne/discipline/storione",
      defaultMinWeight: null,
      defaultMaxCatchesPerDay: 5,
      defaultPointsPerKg: 0,
      defaultBonusPoints: 0,
      displayOrder: 32,
    },

    // KAYAK FISHING ACQUE INTERNE
    {
      name: "FIPSAS Kayak Fishing Acque Interne",
      description: "Profilo ufficiale FIPSAS per tornei Kayak Fishing in acque interne. Pesca da kayak in laghi e fiumi.",
      isSystemProfile: true,
      discipline: TournamentDiscipline.KAYAK_FISHING_INTERNO,
      level: TournamentLevel.REGIONAL,
      gameMode: GameMode.CATCH_RELEASE,
      followsFipsasRules: true,
      fipsasRegulationUrl: "https://www.fipsas.it/pesca-in-acque-interne/discipline/kayak-fishing",
      defaultMinWeight: null,
      defaultMaxCatchesPerDay: 10,
      defaultPointsPerKg: 0,
      defaultBonusPoints: 0,
      displayOrder: 33,
    },

    // =========================================================================
    // CASTING - DISCIPLINE TECNICHE
    // =========================================================================

    // LONG CASTING
    {
      name: "FIPSAS Long Casting",
      description: "Profilo ufficiale FIPSAS per tornei Long Casting. Gare di lancio a distanza.",
      isSystemProfile: true,
      discipline: TournamentDiscipline.LONG_CASTING,
      level: TournamentLevel.NATIONAL,
      gameMode: GameMode.TRADITIONAL,
      followsFipsasRules: true,
      fipsasRegulationUrl: "https://www.fipsas.it/casting/discipline/long-casting",
      defaultMinWeight: null,
      defaultMaxCatchesPerDay: null,
      defaultPointsPerKg: 0,
      defaultBonusPoints: 0,
      displayOrder: 34,
    },

    // FLY CASTING
    {
      name: "FIPSAS Fly Casting",
      description: "Profilo ufficiale FIPSAS per tornei Fly Casting. Gare di lancio con coda di topo.",
      isSystemProfile: true,
      discipline: TournamentDiscipline.FLY_CASTING,
      level: TournamentLevel.NATIONAL,
      gameMode: GameMode.TRADITIONAL,
      followsFipsasRules: true,
      fipsasRegulationUrl: "https://www.fipsas.it/casting/discipline/fly-casting",
      defaultMinWeight: null,
      defaultMaxCatchesPerDay: null,
      defaultPointsPerKg: 0,
      defaultBonusPoints: 0,
      displayOrder: 35,
    },

    // CASTING
    {
      name: "FIPSAS Casting",
      description: "Profilo ufficiale FIPSAS per tornei Casting. Gare di precisione e distanza nel lancio.",
      isSystemProfile: true,
      discipline: TournamentDiscipline.CASTING,
      level: TournamentLevel.NATIONAL,
      gameMode: GameMode.TRADITIONAL,
      followsFipsasRules: true,
      fipsasRegulationUrl: "https://www.fipsas.it/casting/discipline/casting",
      defaultMinWeight: null,
      defaultMaxCatchesPerDay: null,
      defaultPointsPerKg: 0,
      defaultBonusPoints: 0,
      displayOrder: 36,
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
      displayOrder: 99, // sempre ultimo
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
