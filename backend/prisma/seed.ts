/**
 * =============================================================================
 * FILE INFO
 * =============================================================================
 * Percorso: prisma/seed.ts
 * Creato: 2025-12-29
 * Descrizione: Seed database con dati demo IschiaFishing
 *
 * Esecuzione: npx prisma db seed
 *
 * Dati Demo:
 * - 1 Tenant: IschiaFishing
 * - 12 Utenti: 1 admin, 1 giudice, 10 pescatori
 * - 3 Team: Ticket To Ride, FischinDream, Jambo
 * - 5 Specie: tonno rosso, pesce spada, alalunga, aguglia imperiale, lampuga
 * - 8 Tornei: 2 completati, 2 in corso, 4 futuri (con banner images)
 * - Catture con punteggi realistici
 * =============================================================================
 */

import { PrismaClient, UserRole, TournamentStatus, TournamentDiscipline, RegistrationStatus, CatchStatus } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// Password hash per tutti gli utenti demo (password: "demo123")
const DEMO_PASSWORD_HASH = bcrypt.hashSync('demo123', 10);
// Password hash per SuperAdmin (password: "Gerstofen22")
const SUPERADMIN_PASSWORD_HASH = bcrypt.hashSync('Gerstofen22', 10);

async function main() {
  console.log('🌊 Seeding TournamentMaster database...\n');

  // ================================
  // 0. SUPER ADMIN - Vincenzo Marino (vede tutto, gestisce tutto)
  // ================================
  console.log('👑 Creating SuperAdmin: Vincenzo Marino');
  const superAdmin = await prisma.user.upsert({
    where: { email: 'marino@unitec.it' },
    update: {
      passwordHash: SUPERADMIN_PASSWORD_HASH,
      role: UserRole.SUPER_ADMIN,
    },
    create: {
      email: 'marino@unitec.it',
      passwordHash: SUPERADMIN_PASSWORD_HASH,
      firstName: 'Vincenzo',
      lastName: 'Marino',
      role: UserRole.SUPER_ADMIN,
      isActive: true,
      isVerified: true,
      tenantId: null, // SuperAdmin non appartiene a nessun tenant
    },
  });

  // ================================
  // 1. TENANT - IschiaFishing
  // ================================
  console.log('📍 Creating tenant: IschiaFishing');
  const tenant = await prisma.tenant.upsert({
    where: { slug: 'ischiafishing' },
    update: {},
    create: {
      name: 'IschiaFishing',
      slug: 'ischiafishing',
      domain: 'ischiafishing.it',
      logo: '/logos/ischiafishing.png',
      primaryColor: '#0066CC',
      isActive: true,
    },
  });

  // ================================
  // 2. SPECIES - Traina d'Altura
  // ================================
  console.log('🐟 Creating species for Traina d\'Altura');
  const speciesData = [
    { scientificName: 'Thunnus thynnus', commonNameIt: 'Tonno rosso', commonNameEn: 'Bluefin Tuna', pointsMultiplier: 1.0, minSizeCm: 115 },
    { scientificName: 'Xiphias gladius', commonNameIt: 'Pesce spada', commonNameEn: 'Swordfish', pointsMultiplier: 1.2, minSizeCm: 140 },
    { scientificName: 'Thunnus alalunga', commonNameIt: 'Alalunga', commonNameEn: 'Albacore', pointsMultiplier: 0.8, minSizeCm: 80 },
    { scientificName: 'Tetrapturus belone', commonNameIt: 'Aguglia imperiale', commonNameEn: 'Mediterranean Spearfish', pointsMultiplier: 0.9, minSizeCm: 120 },
    { scientificName: 'Coryphaena hippurus', commonNameIt: 'Lampuga', commonNameEn: 'Mahi-mahi', pointsMultiplier: 0.6, minSizeCm: 40 },
  ];

  const species: Record<string, { id: string; pointsMultiplier: number }> = {};
  for (const sp of speciesData) {
    const created = await prisma.species.upsert({
      where: { scientificName: sp.scientificName },
      update: {},
      create: sp,
    });
    species[sp.commonNameIt] = { id: created.id, pointsMultiplier: Number(created.pointsMultiplier) };
  }

  // ================================
  // 3. USERS - Admin, Presidente, Giudice, Pescatori
  // ================================
  console.log('👥 Creating users');

  // Admin Società - Crescenzo Mendella (Amministratore IschiaFishing)
  const admin = await prisma.user.upsert({
    where: { email: 'admin@ischiafishing.it' },
    update: {
      firstName: 'Crescenzo',
      lastName: 'Mendella',
      passwordHash: DEMO_PASSWORD_HASH,
    },
    create: {
      email: 'admin@ischiafishing.it',
      passwordHash: DEMO_PASSWORD_HASH,
      firstName: 'Crescenzo',
      lastName: 'Mendella',
      phone: '+39 081 1234567',
      role: UserRole.TENANT_ADMIN,
      isActive: true,
      isVerified: true,
      tenantId: tenant.id,
    },
  });

  // Presidente Associazione - Massimo Bottiglieri (secondo admin)
  const presidente = await prisma.user.upsert({
    where: { email: 'presidente@ischiafishing.it' },
    update: {
      passwordHash: DEMO_PASSWORD_HASH,
      role: UserRole.PRESIDENT,
    },
    create: {
      email: 'presidente@ischiafishing.it',
      passwordHash: DEMO_PASSWORD_HASH,
      firstName: 'Massimo',
      lastName: 'Bottiglieri',
      phone: '+39 081 9876543',
      role: UserRole.PRESIDENT, // Presidente = secondo admin della società
      isActive: true,
      isVerified: true,
      tenantId: tenant.id,
    },
  });

  // Utente normale - Gennaro Colicchio (può solo vedere info della società)
  const utenteBase = await prisma.user.upsert({
    where: { email: 'utente@ischiafishing.it' },
    update: {
      passwordHash: DEMO_PASSWORD_HASH,
    },
    create: {
      email: 'utente@ischiafishing.it',
      passwordHash: DEMO_PASSWORD_HASH,
      firstName: 'Gennaro',
      lastName: 'Colicchio',
      phone: '+39 081 5555555',
      role: UserRole.PARTICIPANT,
      isActive: true,
      isVerified: true,
      tenantId: tenant.id,
    },
  });

  // Giudice
  const judge = await prisma.user.upsert({
    where: { email: 'giudice@ischiafishing.it' },
    update: {},
    create: {
      email: 'giudice@ischiafishing.it',
      passwordHash: DEMO_PASSWORD_HASH,
      firstName: 'Luca',
      lastName: 'Bianchi',
      phone: '+39 081 2345678',
      role: UserRole.JUDGE,
      isActive: true,
      isVerified: true,
      tenantId: tenant.id,
    },
  });

  // Team Ticket To Ride (4 membri)
  const teamTicketToRide = [
    { firstName: 'Giuseppe', lastName: 'Marino', email: 'g.marino@demo.it', fipsasNumber: 'FI-2024-001' },
    { firstName: 'Antonio', lastName: 'Ferrara', email: 'a.ferrara@demo.it', fipsasNumber: 'FI-2024-002' },
    { firstName: 'Salvatore', lastName: 'Esposito', email: 's.esposito@demo.it', fipsasNumber: 'FI-2024-003' },
    { firstName: 'Francesco', lastName: 'Romano', email: 'f.romano@demo.it', fipsasNumber: 'FI-2024-004' },
  ];

  // Team FischinDream (4 membri)
  const teamFischinDream = [
    { firstName: 'Marco', lastName: 'De Luca', email: 'm.deluca@demo.it', fipsasNumber: 'FI-2024-005' },
    { firstName: 'Giovanni', lastName: 'Conte', email: 'g.conte@demo.it', fipsasNumber: 'FI-2024-006' },
    { firstName: 'Paolo', lastName: 'Ricci', email: 'p.ricci@demo.it', fipsasNumber: 'FI-2024-007' },
    { firstName: 'Andrea', lastName: 'Galli', email: 'a.galli@demo.it', fipsasNumber: 'FI-2024-008' },
  ];

  // Team Jambo (4 membri)
  const teamJambo = [
    { firstName: 'Roberto', lastName: 'Colombo', email: 'r.colombo@demo.it', fipsasNumber: 'FI-2024-009' },
    { firstName: 'Massimo', lastName: 'Barbieri', email: 'm.barbieri@demo.it', fipsasNumber: 'FI-2024-010' },
    { firstName: 'Stefano', lastName: 'Greco', email: 's.greco@demo.it', fipsasNumber: 'FI-2024-011' },
    { firstName: 'Fabio', lastName: 'Bruno', email: 'f.bruno@demo.it', fipsasNumber: 'FI-2024-012' },
  ];

  const allParticipants = [...teamTicketToRide, ...teamFischinDream, ...teamJambo];
  const users: Record<string, string> = {}; // email -> id

  for (const p of allParticipants) {
    const user = await prisma.user.upsert({
      where: { email: p.email },
      update: {},
      create: {
        email: p.email,
        passwordHash: DEMO_PASSWORD_HASH,
        firstName: p.firstName,
        lastName: p.lastName,
        fipsasNumber: p.fipsasNumber,
        role: UserRole.PARTICIPANT,
        isActive: true,
        isVerified: true,
        tenantId: tenant.id,
      },
    });
    users[p.email] = user.id;
  }

  // ================================
  // 4. TOURNAMENTS
  // ================================
  console.log('🏆 Creating tournaments');

  // Ischia fishing zone GeoJSON (area marina Ischia)
  const ischiaZoneGeoJson = JSON.stringify({
    type: 'Polygon',
    coordinates: [[
      [13.85, 40.75], [13.95, 40.75], [13.95, 40.70], [13.85, 40.70], [13.85, 40.75]
    ]]
  });

  // Banner images from Unsplash (free to use)
  const bannerImages = {
    biggame: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800&h=400&fit=crop',
    fishing: 'https://images.unsplash.com/photo-1499242165961-ebe34e974e1f?w=800&h=400&fit=crop',
    ocean: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&h=400&fit=crop',
    boat: 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=800&h=400&fit=crop',
    sunset: 'https://images.unsplash.com/photo-1519046904884-53103b34b206?w=800&h=400&fit=crop',
    tropical: 'https://images.unsplash.com/photo-1505118380757-91f5f5632de0?w=800&h=400&fit=crop',
    coast: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=800&h=400&fit=crop',
    tuna: 'https://images.unsplash.com/photo-1534043464124-3be32fe000c9?w=800&h=400&fit=crop',
  };

  // Torneo 1: COMPLETATO (Giugno 2024)
  const tournament1 = await prisma.tournament.upsert({
    where: { id: 'demo-tournament-completed' },
    update: {},
    create: {
      id: 'demo-tournament-completed',
      name: 'Trofeo Ischia Big Game 2024',
      description: 'Torneo di traina d\'altura nelle acque di Ischia. Competizione storica giunta alla 15a edizione.',
      discipline: TournamentDiscipline.BIG_GAME,
      status: TournamentStatus.COMPLETED,
      startDate: new Date('2024-06-15T06:00:00Z'),
      endDate: new Date('2024-06-16T18:00:00Z'),
      registrationOpens: new Date('2024-05-01T00:00:00Z'),
      registrationCloses: new Date('2024-06-10T23:59:59Z'),
      location: 'Porto di Ischia',
      locationLat: 40.7420,
      locationLng: 13.9420,
      registrationFee: 150.00,
      maxParticipants: 30,
      minParticipants: 6,
      minWeight: 5.0,
      maxCatchesPerDay: 5,
      pointsPerKg: 100,
      bonusPoints: 50,
      bannerImage: bannerImages.biggame,
      tenantId: tenant.id,
      organizerId: admin.id,
    },
  });

  // Torneo 2: IN CORSO (oggi)
  const today = new Date();
  const tournament2 = await prisma.tournament.upsert({
    where: { id: 'demo-tournament-live' },
    update: {},
    create: {
      id: 'demo-tournament-live',
      name: 'Coppa Inverno Ischia 2024',
      description: 'Torneo invernale di traina costiera. Catture aperte a tutte le specie pelagiche.',
      discipline: TournamentDiscipline.BIG_GAME,
      status: TournamentStatus.ONGOING,
      startDate: new Date(today.setHours(6, 0, 0, 0)),
      endDate: new Date(new Date(today).setDate(today.getDate() + 1)),
      registrationOpens: new Date('2024-12-01T00:00:00Z'),
      registrationCloses: new Date('2024-12-28T23:59:59Z'),
      location: 'Porto di Forio',
      locationLat: 40.7370,
      locationLng: 13.8580,
      registrationFee: 100.00,
      maxParticipants: 20,
      minWeight: 3.0,
      maxCatchesPerDay: 10,
      pointsPerKg: 100,
      bannerImage: bannerImages.boat,
      tenantId: tenant.id,
      organizerId: admin.id,
    },
  });

  // Torneo 3: FUTURO (Agosto 2025)
  const tournament3 = await prisma.tournament.upsert({
    where: { id: 'demo-tournament-future' },
    update: {},
    create: {
      id: 'demo-tournament-future',
      name: 'Gran Premio Estate 2025',
      description: 'Il torneo più atteso dell\'estate! Due giorni di competizione nelle acque del Golfo di Napoli.',
      discipline: TournamentDiscipline.BIG_GAME,
      status: TournamentStatus.PUBLISHED,
      startDate: new Date('2025-08-15T06:00:00Z'),
      endDate: new Date('2025-08-16T18:00:00Z'),
      registrationOpens: new Date('2025-06-01T00:00:00Z'),
      registrationCloses: new Date('2025-08-10T23:59:59Z'),
      location: 'Porto di Ischia',
      locationLat: 40.7420,
      locationLng: 13.9420,
      registrationFee: 200.00,
      maxParticipants: 40,
      minWeight: 5.0,
      maxCatchesPerDay: 5,
      pointsPerKg: 100,
      bonusPoints: 100,
      bannerImage: bannerImages.sunset,
      tenantId: tenant.id,
      organizerId: admin.id,
    },
  });

  // Torneo 4: SURF CASTING COMPLETATO (Ottobre 2024)
  const tournament4 = await prisma.tournament.upsert({
    where: { id: 'demo-tournament-surfcasting' },
    update: {},
    create: {
      id: 'demo-tournament-surfcasting',
      name: 'Campionato Surf Casting Ischia',
      description: 'Gara di surf casting sulla spiaggia dei Maronti. Aperta a tutte le categorie.',
      discipline: TournamentDiscipline.SHORE,
      status: TournamentStatus.COMPLETED,
      startDate: new Date('2024-10-20T05:00:00Z'),
      endDate: new Date('2024-10-20T12:00:00Z'),
      registrationOpens: new Date('2024-09-01T00:00:00Z'),
      registrationCloses: new Date('2024-10-15T23:59:59Z'),
      location: 'Spiaggia dei Maronti',
      locationLat: 40.7020,
      locationLng: 13.9150,
      registrationFee: 50.00,
      maxParticipants: 50,
      minWeight: 0.1,
      maxCatchesPerDay: 20,
      pointsPerKg: 200,
      bannerImage: bannerImages.coast,
      tenantId: tenant.id,
      organizerId: admin.id,
    },
  });

  // Torneo 5: SPINNING IN CORSO
  const tournament5 = await prisma.tournament.upsert({
    where: { id: 'demo-tournament-spinning' },
    update: {},
    create: {
      id: 'demo-tournament-spinning',
      name: 'Spinning Challenge Procida',
      description: 'Torneo di spinning leggero nelle acque di Procida. Artificiali consentiti.',
      discipline: TournamentDiscipline.EGING,
      status: TournamentStatus.ONGOING,
      startDate: new Date(new Date().setHours(5, 0, 0, 0)),
      endDate: new Date(new Date().setDate(new Date().getDate() + 2)),
      registrationOpens: new Date('2024-12-01T00:00:00Z'),
      registrationCloses: new Date('2024-12-27T23:59:59Z'),
      location: 'Marina di Procida',
      locationLat: 40.7620,
      locationLng: 14.0280,
      registrationFee: 75.00,
      maxParticipants: 30,
      minWeight: 0.5,
      maxCatchesPerDay: 15,
      pointsPerKg: 150,
      bannerImage: bannerImages.ocean,
      tenantId: tenant.id,
      organizerId: admin.id,
    },
  });

  // Torneo 6: BOLENTINO PUBBLICATO (Febbraio 2025)
  const tournament6 = await prisma.tournament.upsert({
    where: { id: 'demo-tournament-bolentino' },
    update: {},
    create: {
      id: 'demo-tournament-bolentino',
      name: 'Trofeo Bolentino Napoli',
      description: 'Classica gara di bolentino profondo nel Golfo di Napoli.',
      discipline: TournamentDiscipline.BOLENTINO,
      status: TournamentStatus.PUBLISHED,
      startDate: new Date('2025-02-15T06:00:00Z'),
      endDate: new Date('2025-02-15T16:00:00Z'),
      registrationOpens: new Date('2025-01-01T00:00:00Z'),
      registrationCloses: new Date('2025-02-10T23:59:59Z'),
      location: 'Porticciolo Mergellina',
      locationLat: 40.8280,
      locationLng: 14.2150,
      registrationFee: 80.00,
      maxParticipants: 25,
      minWeight: 0.3,
      maxCatchesPerDay: 25,
      pointsPerKg: 180,
      bannerImage: bannerImages.fishing,
      tenantId: tenant.id,
      organizerId: admin.id,
    },
  });

  // Torneo 7: TRAINA COSTIERA PUBBLICATO (Marzo 2025)
  const tournament7 = await prisma.tournament.upsert({
    where: { id: 'demo-tournament-traina' },
    update: {},
    create: {
      id: 'demo-tournament-traina',
      name: 'Coppa Traina Costiera 2025',
      description: 'Torneo di traina costiera con esca viva. Premiazione per la cattura più grande.',
      discipline: TournamentDiscipline.TRAINA_COSTIERA,
      status: TournamentStatus.PUBLISHED,
      startDate: new Date('2025-03-22T06:00:00Z'),
      endDate: new Date('2025-03-23T17:00:00Z'),
      registrationOpens: new Date('2025-02-01T00:00:00Z'),
      registrationCloses: new Date('2025-03-18T23:59:59Z'),
      location: 'Porto di Pozzuoli',
      locationLat: 40.8220,
      locationLng: 14.1180,
      registrationFee: 120.00,
      maxParticipants: 20,
      minWeight: 2.0,
      maxCatchesPerDay: 8,
      pointsPerKg: 120,
      bonusPoints: 75,
      bannerImage: bannerImages.tropical,
      tenantId: tenant.id,
      organizerId: admin.id,
    },
  });

  // Torneo 8: DRIFTING PUBBLICATO (Aprile 2025)
  const tournament8 = await prisma.tournament.upsert({
    where: { id: 'demo-tournament-drifting' },
    update: {},
    create: {
      id: 'demo-tournament-drifting',
      name: 'Drifting Cup Capri',
      description: 'Torneo di drifting nelle acque cristalline di Capri. Solo canna e mulinello.',
      discipline: TournamentDiscipline.DRIFTING,
      status: TournamentStatus.PUBLISHED,
      startDate: new Date('2025-04-12T05:30:00Z'),
      endDate: new Date('2025-04-13T18:00:00Z'),
      registrationOpens: new Date('2025-02-15T00:00:00Z'),
      registrationCloses: new Date('2025-04-08T23:59:59Z'),
      location: 'Marina Grande di Capri',
      locationLat: 40.5500,
      locationLng: 14.2420,
      registrationFee: 180.00,
      maxParticipants: 15,
      minWeight: 3.0,
      maxCatchesPerDay: 6,
      pointsPerKg: 130,
      bonusPoints: 100,
      bannerImage: bannerImages.tuna,
      tenantId: tenant.id,
      organizerId: admin.id,
    },
  });

  // All tournaments array
  const allTournaments = [tournament1, tournament2, tournament3, tournament4, tournament5, tournament6, tournament7, tournament8];

  // Add fishing zones
  for (const t of allTournaments) {
    await prisma.fishingZone.upsert({
      where: { id: `zone-${t.id}` },
      update: {},
      create: {
        id: `zone-${t.id}`,
        name: 'Area Marina Ischia',
        description: 'Zona di pesca autorizzata per il torneo',
        geoJson: ischiaZoneGeoJson,
        minLat: 40.70,
        maxLat: 40.75,
        minLng: 13.85,
        maxLng: 13.95,
        tournamentId: t.id,
      },
    });
  }

  // Add tournament species
  for (const t of allTournaments) {
    for (const [name, data] of Object.entries(species)) {
      await prisma.tournamentSpecies.upsert({
        where: { tournamentId_speciesId: { tournamentId: t.id, speciesId: data.id } },
        update: {},
        create: { tournamentId: t.id, speciesId: data.id },
      });
    }
  }

  // ================================
  // 5. REGISTRATIONS for completed tournament
  // ================================
  console.log('📝 Creating registrations');

  const teamRegistrations: { email: string; teamName: string; boatName: string }[] = [
    ...teamTicketToRide.map(p => ({ email: p.email, teamName: 'Ticket To Ride', boatName: 'Sea Hunter' })),
    ...teamFischinDream.map(p => ({ email: p.email, teamName: 'FischinDream', boatName: 'Dream Catcher' })),
    ...teamJambo.map(p => ({ email: p.email, teamName: 'Jambo', boatName: 'Jambo Star' })),
  ];

  for (const reg of teamRegistrations) {
    await prisma.tournamentRegistration.upsert({
      where: { userId_tournamentId: { userId: users[reg.email], tournamentId: tournament1.id } },
      update: {},
      create: {
        userId: users[reg.email],
        tournamentId: tournament1.id,
        status: RegistrationStatus.CONFIRMED,
        teamName: reg.teamName,
        boatName: reg.boatName,
        boatLength: 12.5,
        amountPaid: 150.00,
        confirmedAt: new Date('2024-06-01'),
      },
    });
  }

  // ================================
  // 6. CATCHES for completed tournament
  // ================================
  console.log('🎣 Creating catches');

  // Catches data: team captain catches (one per team for simplicity)
  const catchesData = [
    // Team Ticket To Ride - 1st place
    { email: 'g.marino@demo.it', speciesName: 'Tonno rosso', weight: 85.5, length: 180, lat: 40.72, lng: 13.90 },
    { email: 'g.marino@demo.it', speciesName: 'Alalunga', weight: 22.3, length: 95, lat: 40.73, lng: 13.88 },
    { email: 'a.ferrara@demo.it', speciesName: 'Lampuga', weight: 8.5, length: 85, lat: 40.71, lng: 13.91 },
    // Team FischinDream - 2nd place
    { email: 'm.deluca@demo.it', speciesName: 'Pesce spada', weight: 62.0, length: 195, lat: 40.74, lng: 13.87 },
    { email: 'g.conte@demo.it', speciesName: 'Aguglia imperiale', weight: 18.5, length: 165, lat: 40.72, lng: 13.89 },
    // Team Jambo - 3rd place
    { email: 'r.colombo@demo.it', speciesName: 'Tonno rosso', weight: 45.2, length: 145, lat: 40.73, lng: 13.92 },
    { email: 'm.barbieri@demo.it', speciesName: 'Lampuga', weight: 12.0, length: 95, lat: 40.71, lng: 13.88 },
  ];

  for (const c of catchesData) {
    const sp = species[c.speciesName];
    const points = c.weight * 100 * sp.pointsMultiplier; // pointsPerKg * weight * speciesMultiplier

    await prisma.catch.create({
      data: {
        userId: users[c.email],
        tournamentId: tournament1.id,
        speciesId: sp.id,
        weight: c.weight,
        length: c.length,
        latitude: c.lat,
        longitude: c.lng,
        gpsAccuracy: 5.0,
        photoPath: `/demo/catches/${c.email.split('@')[0]}_${c.speciesName.replace(' ', '_')}.jpg`,
        caughtAt: new Date('2024-06-15T10:30:00Z'),
        status: CatchStatus.APPROVED,
        points: points,
        isInsideZone: true,
        reviewedAt: new Date('2024-06-15T12:00:00Z'),
        reviewerId: judge.id,
      },
    });
  }

  // ================================
  // 7. LEADERBOARD for completed tournament
  // ================================
  console.log('📊 Creating leaderboard');

  // Calculate team totals
  const teamTotals = [
    { team: 'Ticket To Ride', captain: 'g.marino@demo.it', points: 85.5*100 + 22.3*80 + 8.5*60, weight: 85.5+22.3+8.5, catches: 3, biggest: 85.5 },
    { team: 'FischinDream', captain: 'm.deluca@demo.it', points: 62.0*120 + 18.5*90, weight: 62.0+18.5, catches: 2, biggest: 62.0 },
    { team: 'Jambo', captain: 'r.colombo@demo.it', points: 45.2*100 + 12.0*60, weight: 45.2+12.0, catches: 2, biggest: 45.2 },
  ].sort((a, b) => b.points - a.points);

  let rank = 1;
  for (const t of teamTotals) {
    await prisma.leaderboardEntry.upsert({
      where: { tournamentId_userId: { tournamentId: tournament1.id, userId: users[t.captain] } },
      update: {},
      create: {
        tournamentId: tournament1.id,
        userId: users[t.captain],
        participantName: t.captain.split('@')[0].replace('.', ' '),
        teamName: t.team,
        rank: rank++,
        totalPoints: t.points,
        totalWeight: t.weight,
        catchCount: t.catches,
        biggestCatch: t.biggest,
      },
    });
  }

  console.log('\n✅ Seed completed successfully!');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`📍 Tenant: ${tenant.name}`);
  console.log(`👥 Users: ${allParticipants.length + 5} (1 superadmin, 2 admin, 1 judge, 1 utente, ${allParticipants.length} participants)`);
  console.log(`🐟 Species: ${Object.keys(species).length}`);
  console.log(`🏆 Tournaments: 8 (2 completed, 2 live, 4 upcoming)`);
  console.log(`🎣 Catches: ${catchesData.length}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('\n🔑 Login disponibili:');
  console.log('  👑 SuperAdmin: marino@unitec.it / Gerstofen22');
  console.log('  🏢 Admin:      admin@ischiafishing.it / demo123');
  console.log('  🏢 Presidente: presidente@ischiafishing.it / demo123');
  console.log('  👤 Utente:     utente@ischiafishing.it / demo123');
  console.log('  ⚖️  Giudice:    giudice@ischiafishing.it / demo123\n');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
