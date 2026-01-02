/**
 * =============================================================================
 * FILE INFO
 * =============================================================================
 * Percorso: prisma/seed.ts
 * Creato: 2025-12-29
 * Aggiornato: 2026-01-02 - Aggiunta dati multi-tenant per report
 * Descrizione: Seed database con dati demo completi per report
 *
 * Esecuzione: npx prisma db seed
 *
 * Dati Demo:
 * - 3 Tenant: IschiaFishing, Mare Blu Club, Pesca Sportiva Napoli
 * - 30+ Utenti per tenant con vari ruoli
 * - Teams con membri per ogni torneo
 * - Strikes per tornei in corso
 * - Catture con stati misti (APPROVED, PENDING, REJECTED)
 * - 5 Specie: tonno rosso, pesce spada, alalunga, aguglia imperiale, lampuga
 * - 10+ Tornei per tenant: mix di completati, in corso, futuri
 * - Leaderboard entries per tornei completati
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
  // 1. TENANTS - Multi-tenant per Report Super Admin
  // ================================
  console.log('📍 Creating tenants...');

  // Tenant 1: IschiaFishing (principale, attivo)
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

  // Tenant 2: Mare Blu Club (attivo)
  const tenant2 = await prisma.tenant.upsert({
    where: { slug: 'mareblu' },
    update: {},
    create: {
      name: 'Mare Blu Club',
      slug: 'mareblu',
      domain: 'marebluclub.it',
      logo: '/logos/mareblu.png',
      primaryColor: '#1E40AF',
      isActive: true,
    },
  });

  // Tenant 3: Pesca Sportiva Napoli (attivo)
  const tenant3 = await prisma.tenant.upsert({
    where: { slug: 'pescanapolisport' },
    update: {},
    create: {
      name: 'Pesca Sportiva Napoli',
      slug: 'pescanapolisport',
      domain: 'pescanapolisport.it',
      logo: '/logos/pescanapolisport.png',
      primaryColor: '#059669',
      isActive: true,
    },
  });

  // Tenant 4: Circolo Pescatori Salerno (inattivo - per test report)
  const tenant4 = await prisma.tenant.upsert({
    where: { slug: 'circolosalerno' },
    update: {},
    create: {
      name: 'Circolo Pescatori Salerno',
      slug: 'circolosalerno',
      domain: 'circolopescatorisalerno.it',
      logo: '/logos/salerno.png',
      primaryColor: '#DC2626',
      isActive: false, // Inattivo per test
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
      role: UserRole.PARTICIPANT,
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
  // 3B. USERS per TENANT 2 (Mare Blu Club)
  // ================================
  console.log('👥 Creating users for Mare Blu Club');

  const adminMareBlu = await prisma.user.upsert({
    where: { email: 'admin@marebluclub.it' },
    update: {},
    create: {
      email: 'admin@marebluclub.it',
      passwordHash: DEMO_PASSWORD_HASH,
      firstName: 'Giovanni',
      lastName: 'Rossi',
      phone: '+39 089 1234567',
      role: UserRole.TENANT_ADMIN,
      isActive: true,
      isVerified: true,
      tenantId: tenant2.id,
    },
  });

  // Partecipanti Mare Blu
  const mareBlueParticipants = [
    { firstName: 'Alessandro', lastName: 'Verdi', email: 'a.verdi@mareblu.it', fipsasNumber: 'MB-2024-001' },
    { firstName: 'Davide', lastName: 'Neri', email: 'd.neri@mareblu.it', fipsasNumber: 'MB-2024-002' },
    { firstName: 'Luca', lastName: 'Gialli', email: 'l.gialli@mareblu.it', fipsasNumber: 'MB-2024-003' },
    { firstName: 'Simone', lastName: 'Bianchi', email: 's.bianchi@mareblu.it', fipsasNumber: 'MB-2024-004' },
  ];

  for (const p of mareBlueParticipants) {
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
        tenantId: tenant2.id,
      },
    });
    users[p.email] = user.id;
  }

  // ================================
  // 3C. USERS per TENANT 3 (Pesca Sportiva Napoli)
  // ================================
  console.log('👥 Creating users for Pesca Sportiva Napoli');

  const adminPescaNapoli = await prisma.user.upsert({
    where: { email: 'admin@pescanapolisport.it' },
    update: {},
    create: {
      email: 'admin@pescanapolisport.it',
      passwordHash: DEMO_PASSWORD_HASH,
      firstName: 'Carlo',
      lastName: 'Esposito',
      phone: '+39 081 7654321',
      role: UserRole.TENANT_ADMIN,
      isActive: true,
      isVerified: true,
      tenantId: tenant3.id,
    },
  });

  // Partecipanti Pesca Napoli
  const pescaNapoliParticipants = [
    { firstName: 'Mario', lastName: 'Cuomo', email: 'm.cuomo@pescanapolisport.it', fipsasNumber: 'PN-2024-001' },
    { firstName: 'Luigi', lastName: 'Pagano', email: 'l.pagano@pescanapolisport.it', fipsasNumber: 'PN-2024-002' },
    { firstName: 'Pietro', lastName: 'Sorrentino', email: 'p.sorrentino@pescanapolisport.it', fipsasNumber: 'PN-2024-003' },
    { firstName: 'Vincenzo', lastName: 'Pinto', email: 'v.pinto@pescanapolisport.it', fipsasNumber: 'PN-2024-004' },
    { firstName: 'Antonio', lastName: 'Russo', email: 'a.russo@pescanapolisport.it', fipsasNumber: 'PN-2024-005' },
    { firstName: 'Raffaele', lastName: 'Mazza', email: 'r.mazza@pescanapolisport.it', fipsasNumber: 'PN-2024-006' },
  ];

  for (const p of pescaNapoliParticipants) {
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
        tenantId: tenant3.id,
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

  // ================================
  // 4B. TOURNAMENTS per TENANT 2 (Mare Blu Club)
  // ================================
  console.log('🏆 Creating tournaments for Mare Blu Club');

  const mb_tournament1 = await prisma.tournament.upsert({
    where: { id: 'mb-tournament-completed' },
    update: {},
    create: {
      id: 'mb-tournament-completed',
      name: 'Trofeo Mare Blu 2024',
      description: 'Torneo annuale del Mare Blu Club. Competizione di traina costiera.',
      discipline: TournamentDiscipline.TRAINA_COSTIERA,
      status: TournamentStatus.COMPLETED,
      startDate: new Date('2024-09-10T06:00:00Z'),
      endDate: new Date('2024-09-11T18:00:00Z'),
      registrationOpens: new Date('2024-08-01T00:00:00Z'),
      registrationCloses: new Date('2024-09-05T23:59:59Z'),
      location: 'Porto di Amalfi',
      locationLat: 40.6340,
      locationLng: 14.6020,
      registrationFee: 120.00,
      maxParticipants: 25,
      minWeight: 2.0,
      pointsPerKg: 100,
      bannerImage: bannerImages.fishing,
      tenantId: tenant2.id,
      organizerId: adminMareBlu.id,
    },
  });

  const mb_tournament2 = await prisma.tournament.upsert({
    where: { id: 'mb-tournament-ongoing' },
    update: {},
    create: {
      id: 'mb-tournament-ongoing',
      name: 'Coppa Costiera 2025',
      description: 'Gara invernale di drifting nelle acque della Costiera.',
      discipline: TournamentDiscipline.DRIFTING,
      status: TournamentStatus.ONGOING,
      startDate: new Date(new Date().setHours(5, 0, 0, 0)),
      endDate: new Date(new Date().setDate(new Date().getDate() + 3)),
      registrationOpens: new Date('2024-12-01T00:00:00Z'),
      registrationCloses: new Date('2024-12-30T23:59:59Z'),
      location: 'Marina di Maiori',
      locationLat: 40.6500,
      locationLng: 14.6400,
      registrationFee: 100.00,
      maxParticipants: 20,
      minWeight: 3.0,
      pointsPerKg: 110,
      bannerImage: bannerImages.ocean,
      tenantId: tenant2.id,
      organizerId: adminMareBlu.id,
    },
  });

  const mb_tournament3 = await prisma.tournament.upsert({
    where: { id: 'mb-tournament-draft' },
    update: {},
    create: {
      id: 'mb-tournament-draft',
      name: 'Gran Premio Estate 2025',
      description: 'Torneo estivo in fase di organizzazione.',
      discipline: TournamentDiscipline.BIG_GAME,
      status: TournamentStatus.DRAFT,
      startDate: new Date('2025-07-20T06:00:00Z'),
      endDate: new Date('2025-07-21T18:00:00Z'),
      registrationOpens: new Date('2025-05-01T00:00:00Z'),
      registrationCloses: new Date('2025-07-15T23:59:59Z'),
      location: 'Porto di Amalfi',
      locationLat: 40.6340,
      locationLng: 14.6020,
      registrationFee: 180.00,
      maxParticipants: 30,
      minWeight: 5.0,
      pointsPerKg: 100,
      bannerImage: bannerImages.sunset,
      tenantId: tenant2.id,
      organizerId: adminMareBlu.id,
    },
  });

  // ================================
  // 4C. TOURNAMENTS per TENANT 3 (Pesca Sportiva Napoli)
  // ================================
  console.log('🏆 Creating tournaments for Pesca Sportiva Napoli');

  const pn_tournament1 = await prisma.tournament.upsert({
    where: { id: 'pn-tournament-completed1' },
    update: {},
    create: {
      id: 'pn-tournament-completed1',
      name: 'Memorial Pescatori 2024',
      description: 'Torneo commemorativo annuale. Bolentino di profondità.',
      discipline: TournamentDiscipline.BOLENTINO,
      status: TournamentStatus.COMPLETED,
      startDate: new Date('2024-05-20T05:00:00Z'),
      endDate: new Date('2024-05-20T14:00:00Z'),
      registrationOpens: new Date('2024-04-01T00:00:00Z'),
      registrationCloses: new Date('2024-05-15T23:59:59Z'),
      location: 'Molo Beverello',
      locationLat: 40.8380,
      locationLng: 14.2580,
      registrationFee: 60.00,
      maxParticipants: 40,
      minWeight: 0.2,
      pointsPerKg: 150,
      bannerImage: bannerImages.coast,
      tenantId: tenant3.id,
      organizerId: adminPescaNapoli.id,
    },
  });

  const pn_tournament2 = await prisma.tournament.upsert({
    where: { id: 'pn-tournament-completed2' },
    update: {},
    create: {
      id: 'pn-tournament-completed2',
      name: 'Trofeo San Gennaro',
      description: 'Gara tradizionale di pesca al traino.',
      discipline: TournamentDiscipline.TRAINA_COSTIERA,
      status: TournamentStatus.COMPLETED,
      startDate: new Date('2024-09-19T06:00:00Z'),
      endDate: new Date('2024-09-20T17:00:00Z'),
      registrationOpens: new Date('2024-08-01T00:00:00Z'),
      registrationCloses: new Date('2024-09-15T23:59:59Z'),
      location: 'Porto di Napoli',
      locationLat: 40.8400,
      locationLng: 14.2700,
      registrationFee: 90.00,
      maxParticipants: 30,
      minWeight: 2.0,
      pointsPerKg: 100,
      bannerImage: bannerImages.boat,
      tenantId: tenant3.id,
      organizerId: adminPescaNapoli.id,
    },
  });

  const pn_tournament3 = await prisma.tournament.upsert({
    where: { id: 'pn-tournament-completed3' },
    update: {},
    create: {
      id: 'pn-tournament-completed3',
      name: 'Campionato Sociale 2024',
      description: 'Campionato annuale riservato ai soci.',
      discipline: TournamentDiscipline.SHORE,
      status: TournamentStatus.COMPLETED,
      startDate: new Date('2024-11-15T05:00:00Z'),
      endDate: new Date('2024-11-15T12:00:00Z'),
      registrationOpens: new Date('2024-10-01T00:00:00Z'),
      registrationCloses: new Date('2024-11-10T23:59:59Z'),
      location: 'Lungomare Caracciolo',
      locationLat: 40.8290,
      locationLng: 14.2400,
      registrationFee: 40.00,
      maxParticipants: 50,
      minWeight: 0.1,
      pointsPerKg: 200,
      bannerImage: bannerImages.tropical,
      tenantId: tenant3.id,
      organizerId: adminPescaNapoli.id,
    },
  });

  const pn_tournament4 = await prisma.tournament.upsert({
    where: { id: 'pn-tournament-ongoing' },
    update: {},
    create: {
      id: 'pn-tournament-ongoing',
      name: 'Winter Cup Napoli 2025',
      description: 'Torneo invernale di spinning.',
      discipline: TournamentDiscipline.EGING,
      status: TournamentStatus.ONGOING,
      startDate: new Date(new Date().setHours(6, 0, 0, 0)),
      endDate: new Date(new Date().setDate(new Date().getDate() + 1)),
      registrationOpens: new Date('2024-12-01T00:00:00Z'),
      registrationCloses: new Date('2024-12-29T23:59:59Z'),
      location: 'Marina di Mergellina',
      locationLat: 40.8280,
      locationLng: 14.2150,
      registrationFee: 50.00,
      maxParticipants: 35,
      minWeight: 0.3,
      pointsPerKg: 180,
      bannerImage: bannerImages.fishing,
      tenantId: tenant3.id,
      organizerId: adminPescaNapoli.id,
    },
  });

  const pn_tournament5 = await prisma.tournament.upsert({
    where: { id: 'pn-tournament-published' },
    update: {},
    create: {
      id: 'pn-tournament-published',
      name: 'Trofeo Primavera 2025',
      description: 'Primo grande torneo di stagione.',
      discipline: TournamentDiscipline.BIG_GAME,
      status: TournamentStatus.PUBLISHED,
      startDate: new Date('2025-04-05T06:00:00Z'),
      endDate: new Date('2025-04-06T18:00:00Z'),
      registrationOpens: new Date('2025-02-01T00:00:00Z'),
      registrationCloses: new Date('2025-04-01T23:59:59Z'),
      location: 'Porto di Napoli',
      locationLat: 40.8400,
      locationLng: 14.2700,
      registrationFee: 150.00,
      maxParticipants: 25,
      minWeight: 5.0,
      pointsPerKg: 100,
      bannerImage: bannerImages.biggame,
      tenantId: tenant3.id,
      organizerId: adminPescaNapoli.id,
    },
  });

  // All tournaments array (tutti i tenant)
  const allTournaments = [tournament1, tournament2, tournament3, tournament4, tournament5, tournament6, tournament7, tournament8];
  const allTournamentsTenant2 = [mb_tournament1, mb_tournament2, mb_tournament3];
  const allTournamentsTenant3 = [pn_tournament1, pn_tournament2, pn_tournament3, pn_tournament4, pn_tournament5];

  // Add fishing zones for all tenants
  const allTournamentsGlobal = [...allTournaments, ...allTournamentsTenant2, ...allTournamentsTenant3];
  for (const t of allTournamentsGlobal) {
    await prisma.fishingZone.upsert({
      where: { id: `zone-${t.id}` },
      update: {},
      create: {
        id: `zone-${t.id}`,
        name: 'Area Marina',
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

  // Add tournament species for all tenants
  for (const t of allTournamentsGlobal) {
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

  // ================================
  // 8. TEAMS per tornei
  // ================================
  console.log('⛵ Creating teams');

  // Teams per torneo IschiaFishing completato
  const team1 = await prisma.team.upsert({
    where: { id: 'team-ticket-to-ride' },
    update: {},
    create: {
      id: 'team-ticket-to-ride',
      name: 'Ticket To Ride',
      boatName: 'Sea Hunter',
      boatNumber: 1,
      captainId: users['g.marino@demo.it'],
      clubName: 'IschiaFishing',
      clubCode: 'IF-001',
      tournamentId: tournament1.id,
    },
  });

  const team2 = await prisma.team.upsert({
    where: { id: 'team-fischindream' },
    update: {},
    create: {
      id: 'team-fischindream',
      name: 'FischinDream',
      boatName: 'Dream Catcher',
      boatNumber: 2,
      captainId: users['m.deluca@demo.it'],
      clubName: 'IschiaFishing',
      clubCode: 'IF-002',
      tournamentId: tournament1.id,
    },
  });

  const team3 = await prisma.team.upsert({
    where: { id: 'team-jambo' },
    update: {},
    create: {
      id: 'team-jambo',
      name: 'Jambo',
      boatName: 'Jambo Star',
      boatNumber: 3,
      captainId: users['r.colombo@demo.it'],
      clubName: 'IschiaFishing',
      clubCode: 'IF-003',
      tournamentId: tournament1.id,
    },
  });

  // Teams per torneo live (IschiaFishing)
  const teamLive1 = await prisma.team.upsert({
    where: { id: 'team-live-1' },
    update: {},
    create: {
      id: 'team-live-1',
      name: 'Aquila Marina',
      boatName: 'Flying Eagle',
      boatNumber: 1,
      captainId: users['g.marino@demo.it'],
      clubName: 'IschiaFishing',
      tournamentId: tournament2.id,
    },
  });

  const teamLive2 = await prisma.team.upsert({
    where: { id: 'team-live-2' },
    update: {},
    create: {
      id: 'team-live-2',
      name: 'Onda Blu',
      boatName: 'Blue Wave',
      boatNumber: 2,
      captainId: users['m.deluca@demo.it'],
      clubName: 'IschiaFishing',
      tournamentId: tournament2.id,
    },
  });

  // ================================
  // 9. STRIKES per tornei in corso
  // ================================
  console.log('🎯 Creating strikes');

  // Strikes per torneo live IschiaFishing - PIU' DATI DEMO
  const strikesData = [
    { teamId: teamLive1.id, lat: 40.72, lng: 13.89, rodCount: 2, notes: 'Doppio strike! Tonno in vista', result: 'CATCH' },
    { teamId: teamLive1.id, lat: 40.73, lng: 13.90, rodCount: 1, notes: 'Strike singolo', result: 'LOST' },
    { teamId: teamLive2.id, lat: 40.71, lng: 13.88, rodCount: 1, notes: 'Pesce in fuga', result: 'LOST' },
    { teamId: teamLive2.id, lat: 40.74, lng: 13.91, rodCount: 3, notes: 'Triplo strike!', result: 'CATCH' },
    { teamId: teamLive1.id, lat: 40.72, lng: 13.87, rodCount: 1, notes: null, result: 'RELEASED' },
    { teamId: teamLive1.id, lat: 40.725, lng: 13.885, rodCount: 2, notes: 'Doppio strike mattutino', result: 'CATCH' },
    { teamId: teamLive2.id, lat: 40.715, lng: 13.895, rodCount: 1, notes: 'Alalunga avvistata', result: 'CATCH' },
    { teamId: teamLive1.id, lat: 40.735, lng: 13.875, rodCount: 1, notes: 'Pesce perso dopo 10 minuti', result: 'LOST' },
    { teamId: teamLive2.id, lat: 40.728, lng: 13.892, rodCount: 2, notes: 'Attacco coordinato', result: 'CATCH' },
    { teamId: teamLive1.id, lat: 40.718, lng: 13.882, rodCount: 1, notes: 'Rilasciato sotto misura', result: 'RELEASED' },
    { teamId: teamLive2.id, lat: 40.732, lng: 13.878, rodCount: 1, notes: 'Strike rapido', result: 'LOST' },
    { teamId: teamLive1.id, lat: 40.722, lng: 13.898, rodCount: 3, notes: 'Tripla abboccata!', result: 'CATCH' },
  ];

  for (const s of strikesData) {
    await prisma.strike.create({
      data: {
        tournamentId: tournament2.id,
        teamId: s.teamId,
        strikeAt: new Date(new Date().getTime() - Math.random() * 3600000 * 4), // Ultime 4 ore
        rodCount: s.rodCount,
        notes: s.notes,
        latitude: s.lat,
        longitude: s.lng,
        result: s.result,
        reportedById: users['g.marino@demo.it'],
      },
    });
  }

  // ================================
  // 9B. CATCHES per tornei LIVE (statistiche real-time)
  // ================================
  console.log('🎣 Creating catches for LIVE tournaments');

  // Catture per torneo live IschiaFishing (Coppa Inverno Ischia 2024)
  const liveCatchesIschia = [
    { email: 'g.marino@demo.it', speciesName: 'Tonno rosso', weight: 67.5, status: CatchStatus.APPROVED, hoursAgo: 2 },
    { email: 'g.marino@demo.it', speciesName: 'Alalunga', weight: 19.8, status: CatchStatus.APPROVED, hoursAgo: 3 },
    { email: 'm.deluca@demo.it', speciesName: 'Pesce spada', weight: 45.2, status: CatchStatus.APPROVED, hoursAgo: 1.5 },
    { email: 'm.deluca@demo.it', speciesName: 'Lampuga', weight: 11.3, status: CatchStatus.PENDING, hoursAgo: 0.5 },
    { email: 'a.ferrara@demo.it', speciesName: 'Tonno rosso', weight: 52.0, status: CatchStatus.APPROVED, hoursAgo: 4 },
    { email: 'g.conte@demo.it', speciesName: 'Aguglia imperiale', weight: 15.8, status: CatchStatus.APPROVED, hoursAgo: 2.5 },
    { email: 's.esposito@demo.it', speciesName: 'Alalunga', weight: 23.5, status: CatchStatus.PENDING, hoursAgo: 1 },
    { email: 'r.colombo@demo.it', speciesName: 'Lampuga', weight: 8.9, status: CatchStatus.APPROVED, hoursAgo: 3.5 },
    { email: 'f.romano@demo.it', speciesName: 'Tonno rosso', weight: 78.2, status: CatchStatus.APPROVED, hoursAgo: 0.75 },
    { email: 'p.ricci@demo.it', speciesName: 'Pesce spada', weight: 38.7, status: CatchStatus.REJECTED, hoursAgo: 5, reviewNotes: 'Foto non valida' },
  ];

  for (const c of liveCatchesIschia) {
    const sp = species[c.speciesName];
    const caughtAt = new Date(new Date().getTime() - c.hoursAgo * 3600000);
    await prisma.catch.create({
      data: {
        userId: users[c.email],
        tournamentId: tournament2.id,
        speciesId: sp.id,
        weight: c.weight,
        length: c.weight * 2.2,
        latitude: 40.72 + (Math.random() - 0.5) * 0.04,
        longitude: 13.88 + (Math.random() - 0.5) * 0.04,
        gpsAccuracy: 4.5,
        photoPath: `/demo/catches/live_${c.email.split('@')[0]}_${Date.now()}.jpg`,
        caughtAt: caughtAt,
        status: c.status,
        points: c.status === CatchStatus.APPROVED ? c.weight * 100 * sp.pointsMultiplier : null,
        isInsideZone: true,
        reviewNotes: c.reviewNotes || null,
        reviewedAt: c.status !== CatchStatus.PENDING ? new Date(caughtAt.getTime() + 1800000) : null,
        reviewerId: c.status !== CatchStatus.PENDING ? judge.id : null,
      },
    });
  }

  // Registrazioni per torneo live IschiaFishing
  for (const p of [...teamTicketToRide, ...teamFischinDream, ...teamJambo]) {
    await prisma.tournamentRegistration.upsert({
      where: { userId_tournamentId: { userId: users[p.email], tournamentId: tournament2.id } },
      update: {},
      create: {
        userId: users[p.email],
        tournamentId: tournament2.id,
        status: RegistrationStatus.CONFIRMED,
        teamName: teamTicketToRide.some(m => m.email === p.email) ? 'Aquila Marina' :
                  teamFischinDream.some(m => m.email === p.email) ? 'Onda Blu' : 'Jambo Live',
        boatName: teamTicketToRide.some(m => m.email === p.email) ? 'Flying Eagle' :
                  teamFischinDream.some(m => m.email === p.email) ? 'Blue Wave' : 'Jambo Runner',
        boatLength: 11.5,
        amountPaid: 100.00,
        confirmedAt: new Date('2024-12-25'),
      },
    });
  }

  // ================================
  // 10. CATTURE e REGISTRAZIONI per altri tenant
  // ================================
  console.log('🎣 Creating catches for other tenants');

  // Registrazioni e catture per Mare Blu Club
  for (const p of mareBlueParticipants) {
    await prisma.tournamentRegistration.upsert({
      where: { userId_tournamentId: { userId: users[p.email], tournamentId: mb_tournament1.id } },
      update: {},
      create: {
        userId: users[p.email],
        tournamentId: mb_tournament1.id,
        status: RegistrationStatus.CONFIRMED,
        teamName: 'Team Mare Blu',
        boatName: 'Costiera',
        boatLength: 10.5,
        amountPaid: 120.00,
        confirmedAt: new Date('2024-09-01'),
      },
    });
  }

  // Catture per Mare Blu - Torneo COMPLETATO
  const mbCatchesData = [
    { email: 'a.verdi@mareblu.it', speciesName: 'Alalunga', weight: 25.3, status: CatchStatus.APPROVED },
    { email: 'd.neri@mareblu.it', speciesName: 'Lampuga', weight: 9.8, status: CatchStatus.APPROVED },
    { email: 'l.gialli@mareblu.it', speciesName: 'Tonno rosso', weight: 52.1, status: CatchStatus.APPROVED },
    { email: 's.bianchi@mareblu.it', speciesName: 'Pesce spada', weight: 38.5, status: CatchStatus.APPROVED },
    { email: 'a.verdi@mareblu.it', speciesName: 'Lampuga', weight: 7.2, status: CatchStatus.APPROVED },
    { email: 'd.neri@mareblu.it', speciesName: 'Aguglia imperiale', weight: 14.5, status: CatchStatus.APPROVED },
  ];

  for (const c of mbCatchesData) {
    const sp = species[c.speciesName];
    await prisma.catch.create({
      data: {
        userId: users[c.email],
        tournamentId: mb_tournament1.id,
        speciesId: sp.id,
        weight: c.weight,
        length: c.weight * 2.1,
        latitude: 40.63 + Math.random() * 0.02,
        longitude: 14.60 + Math.random() * 0.02,
        gpsAccuracy: 5.0,
        photoPath: `/demo/catches/${c.email.split('@')[0]}.jpg`,
        caughtAt: new Date('2024-09-10T09:30:00Z'),
        status: c.status,
        points: c.status === CatchStatus.APPROVED ? c.weight * 100 * sp.pointsMultiplier : null,
        isInsideZone: true,
      },
    });
  }

  // Registrazioni e catture per Mare Blu - Torneo LIVE (Coppa Costiera 2025)
  for (const p of mareBlueParticipants) {
    await prisma.tournamentRegistration.upsert({
      where: { userId_tournamentId: { userId: users[p.email], tournamentId: mb_tournament2.id } },
      update: {},
      create: {
        userId: users[p.email],
        tournamentId: mb_tournament2.id,
        status: RegistrationStatus.CONFIRMED,
        teamName: 'Costiera Blue Team',
        boatName: 'Amalfi Dream',
        boatLength: 9.5,
        amountPaid: 100.00,
        confirmedAt: new Date('2024-12-28'),
      },
    });
  }

  // Catture LIVE per Mare Blu (mb_tournament2)
  const mbLiveCatches = [
    { email: 'a.verdi@mareblu.it', speciesName: 'Tonno rosso', weight: 42.8, status: CatchStatus.APPROVED, hoursAgo: 1 },
    { email: 'd.neri@mareblu.it', speciesName: 'Alalunga', weight: 18.5, status: CatchStatus.APPROVED, hoursAgo: 2.5 },
    { email: 'l.gialli@mareblu.it', speciesName: 'Pesce spada', weight: 35.2, status: CatchStatus.PENDING, hoursAgo: 0.5 },
    { email: 's.bianchi@mareblu.it', speciesName: 'Lampuga', weight: 6.8, status: CatchStatus.APPROVED, hoursAgo: 3 },
    { email: 'a.verdi@mareblu.it', speciesName: 'Aguglia imperiale', weight: 12.3, status: CatchStatus.APPROVED, hoursAgo: 4 },
  ];

  for (const c of mbLiveCatches) {
    const sp = species[c.speciesName];
    const caughtAt = new Date(new Date().getTime() - c.hoursAgo * 3600000);
    await prisma.catch.create({
      data: {
        userId: users[c.email],
        tournamentId: mb_tournament2.id,
        speciesId: sp.id,
        weight: c.weight,
        length: c.weight * 2.1,
        latitude: 40.65 + (Math.random() - 0.5) * 0.02,
        longitude: 14.64 + (Math.random() - 0.5) * 0.02,
        gpsAccuracy: 5.0,
        photoPath: `/demo/catches/mb_live_${c.email.split('@')[0]}_${Date.now()}.jpg`,
        caughtAt: caughtAt,
        status: c.status,
        points: c.status === CatchStatus.APPROVED ? c.weight * 110 * sp.pointsMultiplier : null,
        isInsideZone: true,
      },
    });
  }

  // Team per Mare Blu torneo live
  const mbTeamLive = await prisma.team.upsert({
    where: { id: 'team-mb-costiera' },
    update: {},
    create: {
      id: 'team-mb-costiera',
      name: 'Costiera Blue Team',
      boatName: 'Amalfi Dream',
      boatNumber: 1,
      captainId: users['a.verdi@mareblu.it'],
      clubName: 'Mare Blu Club',
      clubCode: 'MB-001',
      tournamentId: mb_tournament2.id,
    },
  });

  // Strikes per Mare Blu torneo live
  const mbStrikesLive = [
    { teamId: mbTeamLive.id, lat: 40.65, lng: 14.64, rodCount: 2, notes: 'Doppio strike costa', result: 'CATCH' },
    { teamId: mbTeamLive.id, lat: 40.652, lng: 14.638, rodCount: 1, notes: 'Strike singolo', result: 'LOST' },
    { teamId: mbTeamLive.id, lat: 40.648, lng: 14.642, rodCount: 1, notes: 'Pesce avvistato', result: 'CATCH' },
    { teamId: mbTeamLive.id, lat: 40.655, lng: 14.635, rodCount: 3, notes: 'Triplo strike!', result: 'CATCH' },
  ];

  for (const s of mbStrikesLive) {
    await prisma.strike.create({
      data: {
        tournamentId: mb_tournament2.id,
        teamId: s.teamId,
        strikeAt: new Date(new Date().getTime() - Math.random() * 3600000 * 3),
        rodCount: s.rodCount,
        notes: s.notes,
        latitude: s.lat,
        longitude: s.lng,
        result: s.result,
        reportedById: users['a.verdi@mareblu.it'],
      },
    });
  }

  // Registrazioni e catture per Pesca Sportiva Napoli
  for (const p of pescaNapoliParticipants) {
    await prisma.tournamentRegistration.upsert({
      where: { userId_tournamentId: { userId: users[p.email], tournamentId: pn_tournament1.id } },
      update: {},
      create: {
        userId: users[p.email],
        tournamentId: pn_tournament1.id,
        status: RegistrationStatus.CONFIRMED,
        teamName: 'Napoli Fishing Team',
        boatName: 'Vesuvio',
        amountPaid: 60.00,
        confirmedAt: new Date('2024-05-10'),
      },
    });

    // Seconda registrazione per altro torneo
    await prisma.tournamentRegistration.upsert({
      where: { userId_tournamentId: { userId: users[p.email], tournamentId: pn_tournament2.id } },
      update: {},
      create: {
        userId: users[p.email],
        tournamentId: pn_tournament2.id,
        status: RegistrationStatus.CONFIRMED,
        teamName: 'Napoli Fishing Team',
        boatName: 'Vesuvio',
        amountPaid: 90.00,
        confirmedAt: new Date('2024-09-10'),
      },
    });
  }

  // Catture per Pesca Napoli - torneo 1
  const pnCatchesData1 = [
    { email: 'm.cuomo@pescanapolisport.it', speciesName: 'Lampuga', weight: 5.2, status: CatchStatus.APPROVED },
    { email: 'l.pagano@pescanapolisport.it', speciesName: 'Alalunga', weight: 18.7, status: CatchStatus.APPROVED },
    { email: 'p.sorrentino@pescanapolisport.it', speciesName: 'Tonno rosso', weight: 42.0, status: CatchStatus.APPROVED },
    { email: 'v.pinto@pescanapolisport.it', speciesName: 'Aguglia imperiale', weight: 12.5, status: CatchStatus.REJECTED },
    { email: 'a.russo@pescanapolisport.it', speciesName: 'Pesce spada', weight: 55.8, status: CatchStatus.APPROVED },
    { email: 'r.mazza@pescanapolisport.it', speciesName: 'Lampuga', weight: 7.3, status: CatchStatus.APPROVED },
  ];

  for (const c of pnCatchesData1) {
    const sp = species[c.speciesName];
    await prisma.catch.create({
      data: {
        userId: users[c.email],
        tournamentId: pn_tournament1.id,
        speciesId: sp.id,
        weight: c.weight,
        length: c.weight * 2.0,
        latitude: 40.83 + Math.random() * 0.02,
        longitude: 14.25 + Math.random() * 0.02,
        gpsAccuracy: 4.0,
        photoPath: `/demo/catches/${c.email.split('@')[0]}_pn1.jpg`,
        caughtAt: new Date('2024-05-20T08:00:00Z'),
        status: c.status,
        points: c.status === CatchStatus.APPROVED ? c.weight * 150 * sp.pointsMultiplier : null,
        isInsideZone: true,
        reviewNotes: c.status === CatchStatus.REJECTED ? 'Pesce sotto misura' : null,
      },
    });
  }

  // Catture per Pesca Napoli - torneo 2
  const pnCatchesData2 = [
    { email: 'm.cuomo@pescanapolisport.it', speciesName: 'Tonno rosso', weight: 38.5, status: CatchStatus.APPROVED },
    { email: 'l.pagano@pescanapolisport.it', speciesName: 'Pesce spada', weight: 48.2, status: CatchStatus.APPROVED },
    { email: 'p.sorrentino@pescanapolisport.it', speciesName: 'Alalunga', weight: 21.0, status: CatchStatus.PENDING },
  ];

  for (const c of pnCatchesData2) {
    const sp = species[c.speciesName];
    await prisma.catch.create({
      data: {
        userId: users[c.email],
        tournamentId: pn_tournament2.id,
        speciesId: sp.id,
        weight: c.weight,
        length: c.weight * 2.1,
        latitude: 40.84 + Math.random() * 0.01,
        longitude: 14.27 + Math.random() * 0.01,
        gpsAccuracy: 3.5,
        photoPath: `/demo/catches/${c.email.split('@')[0]}_pn2.jpg`,
        caughtAt: new Date('2024-09-19T10:30:00Z'),
        status: c.status,
        points: c.status === CatchStatus.APPROVED ? c.weight * 100 * sp.pointsMultiplier : null,
        isInsideZone: true,
      },
    });
  }

  // Registrazioni per torneo LIVE Pesca Napoli (Winter Cup)
  for (const p of pescaNapoliParticipants) {
    await prisma.tournamentRegistration.upsert({
      where: { userId_tournamentId: { userId: users[p.email], tournamentId: pn_tournament4.id } },
      update: {},
      create: {
        userId: users[p.email],
        tournamentId: pn_tournament4.id,
        status: RegistrationStatus.CONFIRMED,
        teamName: 'Napoli Winter Team',
        boatName: 'Partenope',
        amountPaid: 50.00,
        confirmedAt: new Date('2024-12-27'),
      },
    });
  }

  // Catture LIVE per Pesca Napoli (Winter Cup - pn_tournament4)
  const pnLiveCatches = [
    { email: 'm.cuomo@pescanapolisport.it', speciesName: 'Alalunga', weight: 16.5, status: CatchStatus.APPROVED, hoursAgo: 0.5 },
    { email: 'l.pagano@pescanapolisport.it', speciesName: 'Lampuga', weight: 5.8, status: CatchStatus.APPROVED, hoursAgo: 1.5 },
    { email: 'p.sorrentino@pescanapolisport.it', speciesName: 'Tonno rosso', weight: 32.4, status: CatchStatus.PENDING, hoursAgo: 0.25 },
    { email: 'v.pinto@pescanapolisport.it', speciesName: 'Aguglia imperiale', weight: 11.2, status: CatchStatus.APPROVED, hoursAgo: 2 },
    { email: 'a.russo@pescanapolisport.it', speciesName: 'Alalunga', weight: 19.8, status: CatchStatus.APPROVED, hoursAgo: 3 },
    { email: 'r.mazza@pescanapolisport.it', speciesName: 'Pesce spada', weight: 28.5, status: CatchStatus.APPROVED, hoursAgo: 1 },
    { email: 'm.cuomo@pescanapolisport.it', speciesName: 'Lampuga', weight: 4.2, status: CatchStatus.APPROVED, hoursAgo: 4 },
  ];

  for (const c of pnLiveCatches) {
    const sp = species[c.speciesName];
    const caughtAt = new Date(new Date().getTime() - c.hoursAgo * 3600000);
    await prisma.catch.create({
      data: {
        userId: users[c.email],
        tournamentId: pn_tournament4.id,
        speciesId: sp.id,
        weight: c.weight,
        length: c.weight * 2.0,
        latitude: 40.828 + (Math.random() - 0.5) * 0.01,
        longitude: 14.215 + (Math.random() - 0.5) * 0.01,
        gpsAccuracy: 4.0,
        photoPath: `/demo/catches/pn_live_${c.email.split('@')[0]}_${Date.now()}.jpg`,
        caughtAt: caughtAt,
        status: c.status,
        points: c.status === CatchStatus.APPROVED ? c.weight * 180 * sp.pointsMultiplier : null,
        isInsideZone: true,
      },
    });
  }

  // Teams per Pesca Napoli
  const pnTeam1 = await prisma.team.upsert({
    where: { id: 'team-pn-vesuvio' },
    update: {},
    create: {
      id: 'team-pn-vesuvio',
      name: 'Napoli Fishing Team',
      boatName: 'Vesuvio',
      boatNumber: 1,
      captainId: users['m.cuomo@pescanapolisport.it'],
      clubName: 'Pesca Sportiva Napoli',
      clubCode: 'PSN-001',
      tournamentId: pn_tournament4.id,
    },
  });

  // Strikes per torneo live Pesca Napoli
  const pnStrikesData = [
    { teamId: pnTeam1.id, lat: 40.828, lng: 14.215, rodCount: 1, notes: 'Strike mattutino', result: 'CATCH' },
    { teamId: pnTeam1.id, lat: 40.829, lng: 14.218, rodCount: 2, notes: 'Doppio!', result: 'CATCH' },
    { teamId: pnTeam1.id, lat: 40.827, lng: 14.212, rodCount: 1, notes: 'Perso vicino barca', result: 'LOST' },
  ];

  for (const s of pnStrikesData) {
    await prisma.strike.create({
      data: {
        tournamentId: pn_tournament4.id,
        teamId: s.teamId,
        strikeAt: new Date(new Date().getTime() - Math.random() * 3600000 * 2),
        rodCount: s.rodCount,
        notes: s.notes,
        latitude: s.lat,
        longitude: s.lng,
        result: s.result,
        reportedById: users['m.cuomo@pescanapolisport.it'],
      },
    });
  }

  // ================================
  // 11. LEADERBOARD per altri tornei completati
  // ================================
  console.log('📊 Creating leaderboards for other tournaments');

  // Leaderboard Mare Blu
  const mbLeaderboard = [
    { email: 'l.gialli@mareblu.it', points: 5210, weight: 52.1, catches: 1, biggest: 52.1 },
    { email: 'a.verdi@mareblu.it', points: 2024, weight: 25.3, catches: 1, biggest: 25.3 },
    { email: 'd.neri@mareblu.it', points: 588, weight: 9.8, catches: 1, biggest: 9.8 },
  ];

  let mbRank = 1;
  for (const entry of mbLeaderboard) {
    await prisma.leaderboardEntry.upsert({
      where: { tournamentId_userId: { tournamentId: mb_tournament1.id, userId: users[entry.email] } },
      update: {},
      create: {
        tournamentId: mb_tournament1.id,
        userId: users[entry.email],
        participantName: entry.email.split('@')[0].replace('.', ' '),
        teamName: 'Team Mare Blu',
        rank: mbRank++,
        totalPoints: entry.points,
        totalWeight: entry.weight,
        catchCount: entry.catches,
        biggestCatch: entry.biggest,
      },
    });
  }

  // Leaderboard Pesca Napoli - Torneo 1
  const pnLeaderboard1 = [
    { email: 'a.russo@pescanapolisport.it', points: 6696, weight: 55.8, catches: 1, biggest: 55.8 },
    { email: 'p.sorrentino@pescanapolisport.it', points: 6300, weight: 42.0, catches: 1, biggest: 42.0 },
    { email: 'l.pagano@pescanapolisport.it', points: 2244, weight: 18.7, catches: 1, biggest: 18.7 },
    { email: 'r.mazza@pescanapolisport.it', points: 657, weight: 7.3, catches: 1, biggest: 7.3 },
    { email: 'm.cuomo@pescanapolisport.it', points: 468, weight: 5.2, catches: 1, biggest: 5.2 },
  ];

  let pnRank = 1;
  for (const entry of pnLeaderboard1) {
    await prisma.leaderboardEntry.upsert({
      where: { tournamentId_userId: { tournamentId: pn_tournament1.id, userId: users[entry.email] } },
      update: {},
      create: {
        tournamentId: pn_tournament1.id,
        userId: users[entry.email],
        participantName: entry.email.split('@')[0].replace('.', ' '),
        teamName: 'Napoli Fishing Team',
        rank: pnRank++,
        totalPoints: entry.points,
        totalWeight: entry.weight,
        catchCount: entry.catches,
        biggestCatch: entry.biggest,
      },
    });
  }

  console.log('\n✅ Seed completed successfully!');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📊 DATI DEMO PER REPORT:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`📍 Tenant: 4 (3 attivi, 1 inattivo)`);
  console.log(`   - IschiaFishing (8 tornei, 17 utenti, 17 catches live)`);
  console.log(`   - Mare Blu Club (3 tornei, 5 utenti, 11 catches, 4 strikes live)`);
  console.log(`   - Pesca Sportiva Napoli (5 tornei, 7 utenti, 16 catches, 6 strikes)`);
  console.log(`   - Circolo Pescatori Salerno (inattivo)`);
  console.log(`👥 Users: 30+ totali con vari ruoli`);
  console.log(`🐟 Species: ${Object.keys(species).length}`);
  console.log(`🏆 Tournaments: 16 totali`);
  console.log(`   - 5 COMPLETED (per report storici)`);
  console.log(`   - 4 ONGOING (per report live con dati real-time)`);
  console.log(`   - 6 PUBLISHED (futuri)`);
  console.log(`   - 1 DRAFT`);
  console.log(`⛵ Teams: 10 con membri`);
  console.log(`🎣 Catches: 45+ con stati misti (APPROVED, PENDING, REJECTED)`);
  console.log(`🎯 Strikes: 19 per tornei live (Ischia 12, Mare Blu 4, Napoli 3)`);
  console.log(`📊 Leaderboards: 3 tornei completati con classifica`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('\n🔑 Login disponibili:');
  console.log('  👑 SuperAdmin: marino@unitec.it / Gerstofen22');
  console.log('');
  console.log('  🏢 IschiaFishing:');
  console.log('     admin@ischiafishing.it / demo123');
  console.log('     presidente@ischiafishing.it / demo123');
  console.log('     giudice@ischiafishing.it / demo123');
  console.log('');
  console.log('  🏢 Mare Blu Club:');
  console.log('     admin@marebluclub.it / demo123');
  console.log('');
  console.log('  🏢 Pesca Sportiva Napoli:');
  console.log('     admin@pescanapolisport.it / demo123');
  console.log('');
}


main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
