/**
 * Seed Demo Participants for "Drifting Cup Capri"
 *
 * Usage: npx ts-node prisma/seed-demo-participants.ts
 */

import { PrismaClient, RegistrationStatus, UserRole } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// Demo participants data
const demoParticipants = [
  {
    firstName: "Marco",
    lastName: "Rossi",
    email: "marco.rossi@demo.com",
    phone: "+39 333 1234567",
    teamName: "Blue Marlin Team",
    boatName: "Stella del Mare",
    boatLength: 12.5,
    clubName: "Circolo Nautico Napoli",
    clubCode: "CN-NA-001",
  },
  {
    firstName: "Giuseppe",
    lastName: "Bianchi",
    email: "giuseppe.bianchi@demo.com",
    phone: "+39 334 2345678",
    teamName: "Fishing Warriors",
    boatName: "Onda Blu",
    boatLength: 10.8,
    clubName: "Lega Navale Salerno",
    clubCode: "LN-SA-015",
  },
  {
    firstName: "Antonio",
    lastName: "Esposito",
    email: "antonio.esposito@demo.com",
    phone: "+39 335 3456789",
    teamName: "Sea Hunters",
    boatName: "Aquila Marina",
    boatLength: 14.2,
    clubName: "Club Nautico Capri",
    clubCode: "CNC-001",
  },
  {
    firstName: "Francesco",
    lastName: "Romano",
    email: "francesco.romano@demo.com",
    phone: "+39 336 4567890",
    teamName: "Deep Blue Crew",
    boatName: "Poseidon",
    boatLength: 11.0,
    clubName: "Circolo Velico Sorrento",
    clubCode: "CVS-003",
  },
  {
    firstName: "Luigi",
    lastName: "Ferrara",
    email: "luigi.ferrara@demo.com",
    phone: "+39 337 5678901",
    teamName: "Tuna Chasers",
    boatName: "Freccia Azzurra",
    boatLength: 13.5,
    clubName: "Club del Mare Amalfi",
    clubCode: "CMA-007",
  },
  {
    firstName: "Salvatore",
    lastName: "Greco",
    email: "salvatore.greco@demo.com",
    phone: "+39 338 6789012",
    teamName: "Mediterranean Kings",
    boatName: "Re del Mare",
    boatLength: 15.0,
    clubName: "Circolo Nautico Ischia",
    clubCode: "CNI-012",
  },
  {
    firstName: "Paolo",
    lastName: "Colombo",
    email: "paolo.colombo@demo.com",
    phone: "+39 339 7890123",
    teamName: "Swordfish Team",
    boatName: "Spada d'Argento",
    boatLength: 12.0,
    clubName: "Lega Navale Napoli",
    clubCode: "LN-NA-008",
  },
  {
    firstName: "Vincenzo",
    lastName: "Marini",
    email: "vincenzo.marini@demo.com",
    phone: "+39 340 8901234",
    teamName: "Drifting Masters",
    boatName: "Vento di Mare",
    boatLength: 11.5,
    clubName: "Club Nautico Procida",
    clubCode: "CNP-004",
  },
  {
    firstName: "Roberto",
    lastName: "Costa",
    email: "roberto.costa@demo.com",
    phone: "+39 341 9012345",
    teamName: "Barracuda Crew",
    boatName: "Barracuda",
    boatLength: 10.2,
    clubName: "Circolo Nautico Napoli",
    clubCode: "CN-NA-001",
  },
  {
    firstName: "Andrea",
    lastName: "Ricci",
    email: "andrea.ricci@demo.com",
    phone: "+39 342 0123456",
    teamName: "Golden Hook",
    boatName: "Amo d'Oro",
    boatLength: 13.0,
    clubName: "Club Velico Capri",
    clubCode: "CVC-002",
  },
  {
    firstName: "Domenico",
    lastName: "Bruno",
    email: "domenico.bruno@demo.com",
    phone: "+39 343 1234567",
    teamName: "Neptune's Pride",
    boatName: "Nettuno",
    boatLength: 14.8,
    clubName: "Lega Navale Salerno",
    clubCode: "LN-SA-015",
  },
  {
    firstName: "Carmine",
    lastName: "De Luca",
    email: "carmine.deluca@demo.com",
    phone: "+39 344 2345678",
    teamName: "Ocean Riders",
    boatName: "Cavaliere dell'Onda",
    boatLength: 12.8,
    clubName: "Club del Mare Amalfi",
    clubCode: "CMA-007",
  },
];

// Demo crew members (will be assigned to teams)
const demoCrewMembers = [
  { firstName: "Giovanni", lastName: "Rizzo", email: "giovanni.rizzo@demo.com" },
  { firstName: "Stefano", lastName: "Gallo", email: "stefano.gallo@demo.com" },
  { firstName: "Michele", lastName: "Conti", email: "michele.conti@demo.com" },
  { firstName: "Fabio", lastName: "De Rosa", email: "fabio.derosa@demo.com" },
  { firstName: "Massimo", lastName: "Lombardi", email: "massimo.lombardi@demo.com" },
  { firstName: "Luca", lastName: "Moretti", email: "luca.moretti@demo.com" },
  { firstName: "Alessandro", lastName: "Barbieri", email: "alessandro.barbieri@demo.com" },
  { firstName: "Simone", lastName: "Fontana", email: "simone.fontana@demo.com" },
  { firstName: "Davide", lastName: "Santoro", email: "davide.santoro@demo.com" },
  { firstName: "Emanuele", lastName: "Caruso", email: "emanuele.caruso@demo.com" },
  { firstName: "Nicola", lastName: "Ferraro", email: "nicola.ferraro@demo.com" },
  { firstName: "Pasquale", lastName: "Mancini", email: "pasquale.mancini@demo.com" },
];

async function main() {
  console.log('🔍 Searching for tournament "Drifting Cup Capri"...');

  // Find the tournament
  const tournament = await prisma.tournament.findFirst({
    where: {
      name: {
        contains: 'Drifting Cup Capri'
      }
    },
    include: {
      tenant: true
    }
  });

  if (!tournament) {
    console.error('❌ Tournament "Drifting Cup Capri" not found!');
    console.log('Available tournaments:');
    const tournaments = await prisma.tournament.findMany({
      select: { id: true, name: true }
    });
    tournaments.forEach(t => console.log(`  - ${t.name} (${t.id})`));
    return;
  }

  console.log(`✅ Found tournament: ${tournament.name} (ID: ${tournament.id})`);
  console.log(`   Tenant: ${tournament.tenant.name}`);
  console.log(`   Status: ${tournament.status}`);

  const passwordHash = await bcrypt.hash('Demo123!', 10);

  // Create participants and registrations
  console.log('\n📝 Creating demo participants...');

  let boatNumber = 1;
  const createdUsers: { id: string; teamIndex: number }[] = [];

  for (const participant of demoParticipants) {
    // Check if user already exists
    let user = await prisma.user.findUnique({
      where: { email: participant.email }
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          email: participant.email,
          passwordHash,
          firstName: participant.firstName,
          lastName: participant.lastName,
          phone: participant.phone,
          role: UserRole.PARTICIPANT,
          tenantId: tournament.tenantId,
          isActive: true,
          isVerified: true,
        }
      });
      console.log(`  ✓ Created user: ${user.firstName} ${user.lastName}`);
    } else {
      console.log(`  ⚠ User already exists: ${user.firstName} ${user.lastName}`);
    }

    // Check if registration exists
    const existingReg = await prisma.tournamentRegistration.findUnique({
      where: {
        userId_tournamentId: {
          userId: user.id,
          tournamentId: tournament.id
        }
      }
    });

    if (!existingReg) {
      // Create registration
      const registration = await prisma.tournamentRegistration.create({
        data: {
          userId: user.id,
          tournamentId: tournament.id,
          status: RegistrationStatus.CONFIRMED,
          teamName: participant.teamName,
          boatName: participant.boatName,
          boatLength: participant.boatLength,
          boatNumber: boatNumber,
          clubName: participant.clubName,
          clubCode: participant.clubCode,
          amountPaid: tournament.registrationFee,
          confirmedAt: new Date(),
        }
      });
      console.log(`  ✓ Registered: ${participant.teamName} (Boat #${boatNumber})`);
    } else {
      console.log(`  ⚠ Already registered: ${participant.teamName}`);
    }

    createdUsers.push({ id: user.id, teamIndex: boatNumber - 1 });
    boatNumber++;
  }

  // Create crew members
  console.log('\n👥 Creating crew members...');

  const crewUsers: string[] = [];
  for (const crew of demoCrewMembers) {
    let user = await prisma.user.findUnique({
      where: { email: crew.email }
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          email: crew.email,
          passwordHash,
          firstName: crew.firstName,
          lastName: crew.lastName,
          role: UserRole.PARTICIPANT,
          tenantId: tournament.tenantId,
          isActive: true,
          isVerified: true,
        }
      });
      console.log(`  ✓ Created crew: ${user.firstName} ${user.lastName}`);
    }
    crewUsers.push(user.id);
  }

  // Create Teams with members
  console.log('\n🚤 Creating teams with crew...');

  for (let i = 0; i < Math.min(demoParticipants.length, 8); i++) {
    const participant = demoParticipants[i];
    const captain = createdUsers[i];

    // Check if team exists
    const existingTeam = await prisma.team.findFirst({
      where: {
        tournamentId: tournament.id,
        boatNumber: i + 1
      }
    });

    if (existingTeam) {
      console.log(`  ⚠ Team already exists: ${existingTeam.name}`);
      continue;
    }

    // Create team
    const team = await prisma.team.create({
      data: {
        name: participant.teamName,
        boatName: participant.boatName,
        boatNumber: i + 1,
        captainId: captain.id,
        clubName: participant.clubName,
        clubCode: participant.clubCode,
        tournamentId: tournament.id,
      }
    });

    // Add captain as team member
    await prisma.teamMember.create({
      data: {
        teamId: team.id,
        userId: captain.id,
        role: 'CAPTAIN'
      }
    });

    // Add 1-2 crew members to each team
    const crewCount = Math.min(2, Math.floor(crewUsers.length / demoParticipants.length));
    for (let j = 0; j < crewCount; j++) {
      const crewIndex = (i * crewCount + j) % crewUsers.length;
      const crewUserId = crewUsers[crewIndex];

      // Check if already member
      const existingMember = await prisma.teamMember.findUnique({
        where: {
          teamId_userId: {
            teamId: team.id,
            userId: crewUserId
          }
        }
      });

      if (!existingMember) {
        await prisma.teamMember.create({
          data: {
            teamId: team.id,
            userId: crewUserId,
            role: 'CREW'
          }
        });
      }
    }

    console.log(`  ✓ Created team: ${team.name} (Boat #${team.boatNumber})`);
  }

  // Summary
  const registrationCount = await prisma.tournamentRegistration.count({
    where: { tournamentId: tournament.id }
  });

  const teamCount = await prisma.team.count({
    where: { tournamentId: tournament.id }
  });

  console.log('\n📊 Summary:');
  console.log(`   Tournament: ${tournament.name}`);
  console.log(`   Total registrations: ${registrationCount}`);
  console.log(`   Total teams: ${teamCount}`);
  console.log('\n✅ Demo data seeded successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
